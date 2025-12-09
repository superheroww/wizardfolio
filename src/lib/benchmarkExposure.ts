import { getSupabaseBrowserClient } from "@/lib/supabase";

export type BenchmarkExposureRow = {
  group_key: string;
  weight_pct: number;
};

export async function fetchBenchmarkExposure(
  benchmarkSymbol: string,
  groupBy: "stock" | "sector" | "region",
): Promise<BenchmarkExposureRow[]> {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client.rpc("get_benchmark_exposure", {
    p_benchmark_etf_symbol: benchmarkSymbol,
    p_group_by: groupBy,
  });

  if (error) {
    console.error("Error fetching benchmark exposure", {
      error,
      benchmarkSymbol,
      groupBy,
    });
    return [];
  }

  return (data ?? []).map((row: any) => {
    const groupKey =
      (row as { group_key?: string }).group_key ??
      (row as { label?: string }).label ??
      "Other";
    const weight =
      (row as { weight_pct?: number | string }).weight_pct ??
      (row as { total_weight_pct?: number | string }).total_weight_pct ??
      0;

    return {
      group_key: groupKey,
      weight_pct: Number(weight ?? 0),
    };
  });
}
