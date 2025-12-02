export const getSocialAiModelName = () => process.env.REDDIT_INGEST_AI_MODEL ?? DEFAULT_MODEL;

export type AiInput = {
  platform: "reddit";
  permalink: string;
  scraped_title?: string;
  scraped_body_preview?: string;
};

export type AiDecision = {
  should_reply: boolean;
  reply_draft: string | null;
  category: string | null;
  priority: string | null;
  reason: string | null;
};

export type SocialAiResponse = {
  decision: AiDecision;
  parseOk: boolean;
  rawResult: Record<string, unknown> | null;
  requestId: string | null;
  model: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `
You are a helpful assistant that reads Reddit posts and decides whether the brand should reply.
Provide a single JSON object with keys: should_reply (boolean), reply_draft (string|null),
category (string|null), priority (string|null), reason (string|null).
Do not explain yourself outside of the JSON object.
`;

const defaultDecision: AiDecision = {
  should_reply: false,
  reply_draft: null,
  category: null,
  priority: null,
  reason: null,
};

const normalizeBoolean = (value: unknown): boolean =>
  typeof value === "boolean" ? value : String(value ?? "").toLowerCase() === "true";

const normalizeString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length ? value.trim() : null;

const parseAiContent = (
  content: string | null | undefined,
): { decision: AiDecision; parseOk: boolean; rawResult: Record<string, unknown> | null } => {
  if (!content) {
    return { decision: defaultDecision, parseOk: false, rawResult: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { decision: defaultDecision, parseOk: false, rawResult: null };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { decision: defaultDecision, parseOk: false, rawResult: null };
  }

  const asRecord = parsed as Record<string, unknown>;
  const decision: AiDecision = {
    should_reply: normalizeBoolean(asRecord.should_reply),
    reply_draft: normalizeString(asRecord.reply_draft),
    category: normalizeString(asRecord.category),
    priority: normalizeString(asRecord.priority),
    reason: normalizeString(asRecord.reason),
  };

  return { decision, parseOk: true, rawResult: asRecord };
};

export async function runSocialAiDecision(input: AiInput): Promise<SocialAiResponse> {
  const model = getSocialAiModelName();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for Reddit ingestion");
  }

  const payload = {
    model,
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT.trim() },
      { role: "user", content: JSON.stringify(input) },
    ],
  };

  console.log(`[AI] ai_input=${JSON.stringify(input)}`);

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${text}`);
  }

  const body = await response.json();
  const requestId = typeof body.id === "string" ? body.id : null;
  const finalMessage = (body.choices?.[0]?.message as { content?: string } | undefined)?.content ?? null;
  const parsed = parseAiContent(finalMessage);

  console.log(
    `[AI] result should_reply=${parsed.decision.should_reply}, category=${
      parsed.decision.category ?? "null"
    }, reason=${parsed.decision.reason ?? "null"}`,
  );

  return {
    decision: parsed.decision,
    parseOk: parsed.parseOk,
    rawResult: parsed.rawResult,
    requestId,
    model,
  };
}
