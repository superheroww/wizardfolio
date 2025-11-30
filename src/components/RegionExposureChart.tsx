"use client";

import * as React from "react";

export type ApiExposureRow = {
  holding_symbol: string;
  holding_name: string;
  country?: string | null;
  sector?: string | null;
  asset_class?: string | null;
  total_weight_pct: number;
};

type RegionExposureChartProps = {
  exposure?: ApiExposureRow[];
};

// Simple color palette (matches your vibe)
const REGION_COLORS: Record<string, string> = {
  US: "#38BDF8", // sky blue
  Canada: "#4ADE80", // green
  International: "#A855F7", // violet
};

type RegionKey = "US" | "Canada" | "International";

function normalizeCountryToRegion(countryRaw: string | null | undefined): RegionKey {
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

function isBond(assetClassRaw: string | null | undefined): boolean {
  if (!assetClassRaw) return false;
  const a = assetClassRaw.toLowerCase();
  return a.includes("bond") || a.includes("fixed income");
}

export default function RegionExposureChart({
  exposure,
}: RegionExposureChartProps) {
  const safeExposure = React.useMemo(
    () => (Array.isArray(exposure) ? exposure : []),
    [exposure]
  );

  const { usPct, caPct, intlPct } = React.useMemo(() => {
    let us = 0;
    let ca = 0;
    let intl = 0;

    for (const row of safeExposure) {
      const weight = row.total_weight_pct ?? 0;
      if (weight <= 0) continue;

      // If you want equity-only region, skip bonds:
      if (isBond(row.asset_class)) continue;

      const region = normalizeCountryToRegion(row.country);
      if (region === "US") us += weight;
      else if (region === "Canada") ca += weight;
      else intl += weight;
    }

    const sum = us + ca + intl || 1;

    return {
      usPct: (us / sum) * 100,
      caPct: (ca / sum) * 100,
      intlPct: (intl / sum) * 100,
    };
  }, [safeExposure]);

  const regions = [
    { label: "U.S.", value: usPct, key: "US" as const },
    { label: "Canada", value: caPct, key: "Canada" as const },
    { label: "International", value: intlPct, key: "International" as const },
  ].filter((r) => r.value > 0.1); // hide truly zero slices

  const hasData = regions.some((r) => r.value > 0.5);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mb-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Where in the world you’re invested
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Split between U.S., Canada, and the rest of the world based on your
          underlying holdings.
        </p>
      </div>

      {hasData ? (
        <>
          {/* Stacked bar */}
          <div className="mt-1 mb-3 h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            {regions.map((r) => (
              <div
                key={r.key}
                className="h-full"
                style={{
                  width: `${r.value}%`,
                  backgroundColor: REGION_COLORS[r.key],
                }}
              />
            ))}
          </div>

          {/* Legend with percentages */}
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {regions.map((r) => (
              <li key={r.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: REGION_COLORS[r.key] }}
                  />
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    {r.label}
                  </span>
                </div>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                  {r.value.toFixed(1).replace(/\.0$/, "")}%
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            Based on the countries tagged in the ETF holdings data. For more
            detail, connect your real accounts in WizardFolio.
          </p>
        </>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Add some ETFs above to see your regional split.
        </p>
      )}
    </section>
  );
}
