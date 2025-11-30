import type { ApiExposureRow } from "@/lib/exposureEngine";

export type SectorSlice = {
  sector: string;
  weightPct: number;
};

export type RegionSlice = {
  region: string;
  weightPct: number;
};

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
