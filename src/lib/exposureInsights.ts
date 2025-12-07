import type { ApiExposureRow } from "@/lib/exposureEngine";
import { aggregateBySector } from "@/lib/exposureAggregations";

export type RegionKey = "US" | "Canada" | "International";

export function normalizeCountryToRegion(
  countryRaw: string | null | undefined,
): RegionKey {
  if (!countryRaw) return "International";

  const c = countryRaw.trim().toLowerCase();

  if (
    c === "us" ||
    c === "usa" ||
    c === "united states" ||
    c === "united states of america"
  ) {
    return "US";
  }

  if (c === "ca" || c === "can" || c === "canada") {
    return "Canada";
  }

  return "International";
}

export function isBond(assetClassRaw: string | null | undefined): boolean {
  if (!assetClassRaw) return false;
  const a = assetClassRaw.toLowerCase();
  return a.includes("bond") || a.includes("fixed income");
}

export function classifyExposure(rows: ApiExposureRow[]): string {
  if (!rows.length) return "Diversified";

  let equity = 0;
  let bonds = 0;
  let us = 0;
  let ca = 0;
  let intl = 0;

  for (const row of rows) {
    const weight = row.total_weight_pct ?? 0;
    if (weight <= 0) continue;

    if (isBond(row.asset_class)) {
      bonds += weight;
    } else {
      equity += weight;
      const region = normalizeCountryToRegion(row.country);
      if (region === "US") us += weight;
      else if (region === "Canada") ca += weight;
      else intl += weight;
    }
  }

  const total = equity + bonds || 1;
  const equityShare = equity / total;
  const bondShare = bonds / total;

  const regionTotal = us + ca + intl || 1;
  const usShare = us / regionTotal;
  const caShare = ca / regionTotal;
  const intlShare = intl / regionTotal;

  let dominantRegion: RegionKey = "International";
  let dominantShare = intlShare;

  if (usShare >= caShare && usShare >= intlShare) {
    dominantRegion = "US";
    dominantShare = usShare;
  } else if (caShare >= usShare && caShare >= intlShare) {
    dominantRegion = "Canada";
    dominantShare = caShare;
  }

  if (dominantRegion === "US" && dominantShare >= 0.5) {
    return "U.S.-Concentrated";
  }
  if (dominantRegion === "Canada" && dominantShare >= 0.3) {
    return "Canada-Tilted";
  }
  if (dominantRegion === "International" && dominantShare >= 0.4) {
    return "International-Heavy";
  }

  if (equityShare > 0.8) return "Equity-Heavy";
  if (equityShare > 0.6) return "Growth-Oriented";
  if (equityShare < 0.4 && bondShare > 0.3) return "Conservative";

  return "Diversified";
}

export function computeCountryExposure(rows: ApiExposureRow[]) {
  let us = 0;
  let canada = 0;
  let international = 0;

  for (const row of rows) {
    const weight = row.total_weight_pct ?? 0;
    if (weight <= 0) continue;

    const region = normalizeCountryToRegion(row.country);
    if (region === "US") {
      us += weight;
    } else if (region === "Canada") {
      canada += weight;
    } else {
      international += weight;
    }
  }

  const total = us + canada + international || 1;

  return {
    us: (us / total) * 100,
    canada: (canada / total) * 100,
    international: (international / total) * 100,
  };
}

export function getTopSectors(
  rows: ApiExposureRow[],
  limit = 2,
): { sector: string; weightPct: number }[] {
  const sectors = aggregateBySector(rows);
  return sectors.slice(0, limit).map((slice) => ({
    sector: slice.sector,
    weightPct: slice.weightPct,
  }));
}
