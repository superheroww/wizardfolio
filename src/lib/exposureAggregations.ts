import type { ApiExposureRow } from "@/lib/exposureEngine";

export type SectorSlice = {
  sector: string;
  weightPct: number;
};

export type RegionSlice = {
  region: string;
  weightPct: number;
};

export function aggregateHoldingsBySymbol(
  exposure: ApiExposureRow[],
): ApiExposureRow[] {
  const holdings = new Map<string, ApiExposureRow>();

  for (const row of exposure ?? []) {
    const rawSymbol = row.holding_symbol?.trim();
    if (!rawSymbol) continue;

    const symbol = rawSymbol.toUpperCase();
    const weight = row.total_weight_pct ?? 0;
    const existing = holdings.get(symbol);

    if (existing) {
      holdings.set(symbol, {
        ...existing,
        total_weight_pct: (existing.total_weight_pct ?? 0) + weight,
      });
    } else {
      holdings.set(symbol, {
        ...row,
        holding_symbol: symbol,
        total_weight_pct: weight,
      });
    }
  }

  return Array.from(holdings.values());
}

export function aggregateBySector(exposure: ApiExposureRow[]): SectorSlice[] {
  const totals = new Map<string, number>();

  for (const row of exposure) {
    const key = row.sector?.trim() || "Other";
    const prev = totals.get(key) ?? 0;
    totals.set(key, prev + row.total_weight_pct);
  }

  return Array.from(totals.entries())
    .map(([sector, weightPct]) => ({ sector, weightPct }))
    .filter((s) => s.weightPct > 0.1)
    .sort((a, b) => b.weightPct - a.weightPct);
}

export function aggregateByRegion(exposure: ApiExposureRow[]): RegionSlice[] {
  const totals = new Map<string, number>();

  for (const row of exposure) {
    const key = row.country?.trim() || "Other";
    const prev = totals.get(key) ?? 0;
    totals.set(key, prev + row.total_weight_pct);
  }

  return Array.from(totals.entries())
    .map(([region, weightPct]) => ({ region, weightPct }))
    .filter((r) => r.weightPct > 0.1)
    .sort((a, b) => b.weightPct - a.weightPct);
}
