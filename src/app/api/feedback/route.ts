import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase URL and service role key are required for /api/feedback");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const JSON_HEADERS = { "Content-Type": "application/json" };

interface FeedbackPayload {
  selectedFeatures: string[];
  message?: string;
  email?: string;
}

const invalidPayloadResponse = () =>
  new Response(JSON.stringify({ error: "Invalid payload" }), {
    status: 400,
    headers: JSON_HEADERS,
  });

const getIpAddress = (headers: Headers): string => {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
};

const hashIp = (ip: string) =>
  createHash("sha256").update(ip).digest("hex");

export async function POST(req: Request) {
  let payload: FeedbackPayload;

  try {
    payload = (await req.json()) as FeedbackPayload;
  } catch {
    return invalidPayloadResponse();
  }

  if (!payload || !Array.isArray(payload.selectedFeatures)) {
    return invalidPayloadResponse();
  }

  if (payload.selectedFeatures.length < 1 || payload.selectedFeatures.length > 10) {
    return invalidPayloadResponse();
  }

  const normalizedFeatures = payload.selectedFeatures.map((feature) =>
    typeof feature === "string" ? feature.trim() : "",
  );

  if (normalizedFeatures.some((feature) => feature.length === 0)) {
    return invalidPayloadResponse();
  }

  const messageRaw = typeof payload.message === "string" ? payload.message.trim() : "";
  const message = messageRaw.length > 0 ? messageRaw : null;
  if (message && message.length > 1000) {
    return invalidPayloadResponse();
  }

  const emailRaw = typeof payload.email === "string" ? payload.email.trim() : "";
  const email = emailRaw.length > 0 ? emailRaw : null;
  if (email && email.length > 120) {
    return invalidPayloadResponse();
  }

  if (email && !email.includes("@")) {
    return invalidPayloadResponse();
  }

  const userAgent = req.headers.get("user-agent")?.trim() || null;
  const ipAddress = getIpAddress(req.headers);
  const ipHash = hashIp(ipAddress);

  const { error } = await supabase.from("feature_feedback").insert({
    email,
    selected_features: normalizedFeatures,
    message,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (error) {
    console.error("feature_feedback insert failed", error);
    return new Response(JSON.stringify({ error: "Failed to save feedback" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}
