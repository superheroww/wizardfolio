"use client";

import * as React from "react";
import { ExposureBreakdown } from "@/lib/exposureEngine";

type RegionExposureChartProps = {
  exposure?: ExposureBreakdown[];
};

// Simple color palette (matches your vibe)
const REGION_COLORS: Record<string, string> = {
  US: "#38BDF8",          // sky blue
  Canada: "#4ADE80",      // green
  International: "#A855F7", // violet
};

type EtfProfile = {
  usShare: number;
  caShare: number;
  intlShare: number;
  isBond: boolean;
};

function getSymbolProfile(symbolRaw: string | undefined): EtfProfile {
  // Default: global-ish equity
  const base: EtfProfile = {
    usShare: 0.4,
    caShare: 0.1,
    intlShare: 0.5,
    isBond: false,
  };

  if (!symbolRaw) return base;

  const symbol = symbolRaw.trim().toUpperCase();
  const plain = symbol.replace(".TO", "");
  const isAny = (...codes: string[]) => codes.includes(plain);

  // Bonds / fixed income (no region contribution for now)
  if (isAny("BND", "ZAG", "XBB", "VAB")) {
    return { usShare: 0, caShare: 0, intlShare: 0, isBond: true };
  }

  // S&P 500 / U.S. large cap
  if (isAny("SPY", "VOO", "IVV", "ZSP", "HXS", "VFV", "VFV.TO")) {
    return { usShare: 1, caShare: 0, intlShare: 0, isBond: false };
  }

  // Nasdaq-heavy, still U.S.-centric
  if (isAny("QQQ", "QQQM", "ZQQ", "HXQ")) {
    return { usShare: 1, caShare: 0, intlShare: 0, isBond: false };
  }

  // All-equity global one-ticket (VEQT/XEQT etc.)
  if (isAny("VEQT", "XEQT", "VEQT.TO", "XEQT.TO")) {
    return { usShare: 0.4, caShare: 0.25, intlShare: 0.35, isBond: false };
  }

  // Balanced/global growth (VGRO/VBAL etc.)
  if (isAny("VGRO", "VBAL", "VGRO.TO", "VBAL.TO", "XGRO", "XBAL")) {
    return { usShare: 0.35, caShare: 0.25, intlShare: 0.4, isBond: false };
  }

  // Canada equity
  if (isAny("XIU", "ZCN", "VCN", "XIC")) {
    return { usShare: 0, caShare: 1, intlShare: 0, isBond: false };
  }

  // International developed
  if (isAny("XEF", "ZEA", "VIU")) {
    return { usShare: 0, caShare: 0, intlShare: 1, isBond: false };
  }

  // Emerging markets
  if (isAny("XEC", "ZEM", "VEE")) {
    return { usShare: 0, caShare: 0, intlShare: 1, isBond: false };
  }

  // Dividend / value-ish
  if (isAny("SCHD", "VDY", "ZDY")) {
    if (plain === "VDY") {
      return { usShare: 0, caShare: 1, intlShare: 0, isBond: false };
    }
    return { usShare: 1, caShare: 0, intlShare: 0, isBond: false };
  }

  // Fallback global equity
  return base;
}

export default function RegionExposureChart({
  exposure,
}: RegionExposureChartProps) {
  const safeExposure = React.useMemo(
    () => (Array.isArray(exposure) ? exposure : []),
    [exposure]
  );

  const { usPct, caPct, intlPct, totalEquity } = React.useMemo(() => {
    let us = 0;
    let ca = 0;
    let intl = 0;

    for (const pos of safeExposure) {
      const weight = pos.weightPct ?? 0;
      if (weight <= 0) continue;

      const profile = getSymbolProfile(pos.symbol);
      if (profile.isBond) continue; // ignore bonds for region for now

      us += weight * profile.usShare;
      ca += weight * profile.caShare;
      intl += weight * profile.intlShare;
    }

    const sum = us + ca + intl || 1;
    return {
      usPct: (us / sum) * 100,
      caPct: (ca / sum) * 100,
      intlPct: (intl / sum) * 100,
      totalEquity: sum, // raw sum, not too important for UI
    };
  }, [safeExposure]);

  const regions = [
    { label: "U.S.", value: usPct, key: "US" },
    { label: "Canada", value: caPct, key: "Canada" },
    { label: "International", value: intlPct, key: "International" },
  ].filter((r) => r.value > 0.1); // hide truly zero slices

  const hasData = regions.some((r) => r.value > 0.5);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mb-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Where in the world you’re invested
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Rough split between U.S., Canada, and the rest of the world based on
          your ETF mix.
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
              <li
                key={r.key}
                className="flex items-center justify-between"
              >
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
                  {r.value.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            This is an approximation. For a full regional breakdown, connect
            your accounts in WizardFolio.
          </p>
        </>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Add some equity ETFs above to see your regional split.
        </p>
      )}
    </section>
  );
}