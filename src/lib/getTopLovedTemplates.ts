import { getSupabaseServerClient } from "@/lib/supabase";
import { TEMPLATE_BY_ID, type Template } from "@/lib/quickStartTemplates";

type TopLovedRow = {
  template_key: string;
  count: number;
};

type GetTopLovedOptions = {
  limit?: number;
  days?: number;
  countryCode?: string | null;
};

export async function getTopLovedTemplates(
  options: GetTopLovedOptions = {},
): Promise<Template[]> {
  const { limit = 4, days = 30, countryCode } = options;

  try {
    const supabase = await getSupabaseServerClient();

    // 💡 FIX: Calculate the cutoff date in Node.js and format it as an ISO 8601 string.
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateISO = cutoffDate.toISOString();

    // Simple approach: fetch recent template events and aggregate counts in JS.
    let query = supabase
      .from("mix_events")
      .select("template_key")
      .eq("source", "template")
      .not("template_key", "is", null)
      // Use the calculated ISO string instead of the raw SQL function
      .gte("created_at", cutoffDateISO)
      .limit(1000);

    if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    const { data, error } = await query;

    if (error || !data) {
      // This will now only log if the query truly failed, not due to the date syntax error
      console.error("[top-loved] query error", error);
      return [];
    }

    const rows = data as { template_key: string }[];

    const counts: Record<string, number> = {};
    for (const r of rows) {
      if (!r.template_key) continue;
      counts[r.template_key] = (counts[r.template_key] || 0) + 1;
    }

    const sortedKeys = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a],
    );

    const topKeys = sortedKeys.slice(0, limit);

    const templates = topKeys
      .map((key) => TEMPLATE_BY_ID.get(key))
      .filter((t): t is Template => Boolean(t));

    return templates;
  } catch (err) {
    console.error("[top-loved] unexpected error", err);
    return [];
  }
}