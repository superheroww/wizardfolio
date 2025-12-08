import { createServerSupabaseClient } from "@/lib/supabaseServer";
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
    const supabase = createServerSupabaseClient();

    // Simple approach: fetch recent template events and aggregate counts in JS.
    let query = supabase
      .from("mix_events")
      .select("template_key")
      .eq("source", "template")
      .not("template_key", "is", null)
      .gte("created_at", `now() - interval '${days} days'`)
      .limit(1000);

    if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    const { data, error } = await query;

    if (error || !data) {
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
