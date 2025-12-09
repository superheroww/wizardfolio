import type { BenchmarkRow } from "@/components/BenchmarkComparisonTable";

export type RawExposureRow = {
  label: string;
  yourWeightPct: number;
  benchmarkWeightPct: number;
  symbol?: string;
};

export function buildBenchmarkRows(raw: RawExposureRow[]): BenchmarkRow[] {
  return raw.map((row) => {
    const diffPct = row.yourWeightPct - row.benchmarkWeightPct;
    return {
      label: row.label,
      symbol: row.symbol,
      yourWeightPct: row.yourWeightPct,
      benchmarkWeightPct: row.benchmarkWeightPct,
      diffPct,
    };
  });
}
