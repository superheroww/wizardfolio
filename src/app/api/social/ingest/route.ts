import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canonicalizeRedditPostPermalink, fetchRedditPostDetails, type RedditScrapeResult } from "@/lib/reddit";
import { AiInput, getSocialAiModelName, runSocialAiDecision, type SocialAiResponse } from "@/lib/socialAi";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.WEBHOOK_SECRET;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase configuration is required for social ingest");
}

if (!webhookSecret) {
  throw new Error("WEBHOOK_SECRET is required for social ingestion");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const JSON_HEADERS = { "Content-Type": "application/json" };

type IngestPayload = {
  raw_reddit_url?: unknown;
};

const sanitizeString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length ? value.trim() : null;

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400, headers: JSON_HEADERS });

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: JSON_HEADERS });

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-wizardlab-token");
  if (!token || token !== webhookSecret) {
    return unauthorized();
  }

  let payload: IngestPayload;
  try {
    payload = (await req.json()) as IngestPayload;
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const rawRedditUrl = sanitizeString(payload.raw_reddit_url);
  if (!rawRedditUrl) {
    return badRequest("raw_reddit_url is required");
  }

  let normalized: { permalink: string; postId: string };
  try {
    normalized = canonicalizeRedditPostPermalink(rawRedditUrl);
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Invalid Reddit URL",
    );
  }

  const { permalink, postId } = normalized;
  console.log(
    `[ingest] raw_reddit_url=${rawRedditUrl}, permalink=${permalink}, external_post_id=${postId}, scrape_status=pending`,
  );

  const { data: existing, error: selectError } = await supabase
    .from("social_engage")
    .select("id")
    .eq("platform", "reddit")
    .eq("permalink", permalink)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error("social_engage lookup failed", selectError);
    return NextResponse.json(
      { error: "Failed to query existing posts" },
      { status: 500, headers: JSON_HEADERS },
    );
  }

  if (existing) {
    return NextResponse.json(
      { status: "skipped" },
      { status: 200, headers: JSON_HEADERS },
    );
  }

  let scraped: RedditScrapeResult;
  try {
    scraped = await fetchRedditPostDetails(permalink);
  } catch (error) {
    const fetchError = error instanceof Error ? error.message : "fetch_failed";
    console.log(
      `[ingest] raw_reddit_url=${rawRedditUrl}, permalink=${permalink}, external_post_id=${postId}, scrape_status=failed, scrape_error=${fetchError}`,
    );

    await supabase.from("social_engage").insert({
      platform: "reddit",
      raw_reddit_url: rawRedditUrl,
      permalink,
      external_post_id: postId,
      external_comment_id: null,
      source: "gmail-f5bot",
      status: "fetch_failed",
      extra: {
        ingest: { source: "gmail-f5bot" },
        scrape: {
          status: "failed",
          fetch_error: fetchError,
        },
      },
    });

    return NextResponse.json(
      { status: "fetch_failed", error: fetchError },
      { status: 200, headers: JSON_HEADERS },
    );
  }

  const bodyPreview = scraped.body ? scraped.body.slice(0, 500) : "";
  const extra = {
    ingest: { source: "gmail-f5bot" },
    scrape: {
      status: "ok",
      body_preview: bodyPreview,
      subreddit: scraped.subreddit,
    },
  };

  console.log(
    `[ingest] raw_reddit_url=${rawRedditUrl}, permalink=${permalink}, external_post_id=${postId}, scrape_status=ok, scrape_error=null`,
  );

  const { data: inserted, error: insertError } = await supabase
    .from("social_engage")
    .insert({
      platform: "reddit",
      raw_reddit_url: rawRedditUrl,
      permalink,
      external_post_id: postId,
      external_comment_id: null,
      channel: scraped.subreddit,
      author_handle: scraped.author,
      title: scraped.title,
      body: scraped.body,
      source: "gmail-f5bot",
      status: "fetched",
      extra,
    })
    .select("id")
    .maybeSingle();

  if (insertError || !inserted?.id) {
    console.error("social_engage insert failed", insertError);
    return NextResponse.json(
      { error: "Failed to save ingestion" },
      { status: 500, headers: JSON_HEADERS },
    );
  }

  const aiInput: AiInput = {
    platform: "reddit",
    permalink,
    scraped_title: scraped.title,
    scraped_body_preview: bodyPreview,
  };

  let aiResponse: SocialAiResponse;
  try {
    aiResponse = await runSocialAiDecision(aiInput);
  } catch (error) {
    const failReason = error instanceof Error ? error.message : "ai_failed";
    console.error("runSocialAiDecision failed", failReason);
    await supabase
      .from("social_engage")
      .update({
        ai_input: JSON.stringify(aiInput),
        ai_parse_ok: false,
        ai_reason: failReason,
        status: "ai_failed",
        classifier_model: getSocialAiModelName(),
        reply_model: getSocialAiModelName(),
      })
      .eq("id", inserted.id);

    return NextResponse.json(
      { status: "ai_failed", error: failReason },
      { status: 500, headers: JSON_HEADERS },
    );
  }

  const { decision, parseOk, rawResult, requestId, model } = aiResponse;
  const finalStatus = decision.should_reply ? "ready" : "ignored";

  const updatePayload = {
    ai_input: JSON.stringify(aiInput),
    ai_result: rawResult,
    ai_should_reply: decision.should_reply,
    ai_reply_draft: decision.reply_draft,
    ai_category: decision.category,
    ai_priority: decision.priority,
    ai_reason: decision.reason,
    ai_parse_ok: parseOk,
    ai_request_id: requestId,
    classifier_model: model,
    reply_model: model,
    status: finalStatus,
  };

  const { error: updateError } = await supabase
    .from("social_engage")
    .update(updatePayload)
    .eq("id", inserted.id);

  if (updateError) {
    console.error("social_engage AI update failed", updateError);
    return NextResponse.json(
      { error: "Failed to save AI decision" },
      { status: 500, headers: JSON_HEADERS },
    );
  }

  return NextResponse.json(
    {
      status: finalStatus,
      should_reply: decision.should_reply,
      ai_category: decision.category,
      ai_priority: decision.priority,
      ai_reason: decision.reason,
    },
    { status: 200, headers: JSON_HEADERS },
  );
}
