"use client";

import * as React from "react";
import { aggregateHoldingsBySymbol } from "@/lib/exposureAggregations";

export type ApiExposureRow = {
  holding_symbol: string;
  holding_name: string;
  country?: string | null;
  sector?: string | null;
  asset_class?: string | null;
  total_weight_pct: number;
};

type NormalizedExposure = {
  symbol: string;
  weightPct: number;
};

type ExposureSummaryProps = {
  exposure: ApiExposureRow[]; // <-- matches API shape
  showHeader?: boolean;
};

const COLOR_PALETTE = [
  "#FF6B6B", // red-pink
  "#FDBA74", // orange-peach
  "#FACC15", // yellow
  "#4ADE80", // green
  "#38BDF8", // bright-blue
  "#A78BFA", // violet
  "#F472B6", // pink
  "#2DD4BF", // teal
  "#60A5FA", // soft-blue
];

type Slice = {
  label: string;
  weightPct: number;
  color: string;
};

// always an integer: 90.4 → 90, 90.5 → 91
const fmtPercent = (value: number | null | undefined) =>
  String(Math.round(value ?? 0));

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

function classifyExposure(rows: ApiExposureRow[]): string {
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

  // -----------------------------
  // 1) Pick dominant region first
  // -----------------------------
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

  // -----------------------------
  // 2) Fall back to risk profile
  // -----------------------------
  if (equityShare > 0.8) return "Equity-Heavy";
  if (equityShare > 0.6) return "Growth-Oriented";
  if (equityShare < 0.4 && bondShare > 0.3) return "Conservative";

  return "Diversified";
}

export default function ExposureSummary({
  exposure,
  showHeader = true,
}: ExposureSummaryProps) {
  const aggregatedExposure = React.useMemo(
    () => aggregateHoldingsBySymbol(exposure),
    [exposure],
  );

  // 1) Normalize API rows into the shape the donut expects
  const normalized = React.useMemo<NormalizedExposure[]>(
    () =>
      aggregatedExposure.map((row) => ({
        symbol: row.holding_symbol,
        weightPct: row.total_weight_pct,
      })),
    [aggregatedExposure],
  );

  // 2) Use normalized data for slices
  const sorted = React.useMemo(
    () => [...normalized].sort((a, b) => (b.weightPct ?? 0) - (a.weightPct ?? 0)),
    [normalized]
  );

  const total = React.useMemo(
    () => sorted.reduce((sum, e) => sum + (e.weightPct ?? 0), 0),
    [sorted]
  );

  const classification = React.useMemo(
    () => classifyExposure(exposure),
    [exposure],
  );

  const slices: Slice[] = React.useMemo(() => {
    if (!sorted.length || total <= 0) return [];

    const MAX_SLICES = 6; // Top 5 + Other
    const main = sorted.slice(0, MAX_SLICES - 1);
    const rest = sorted.slice(MAX_SLICES - 1);

    const result: Slice[] = main.map((e, idx) => ({
      label: e.symbol || "—",
      weightPct: e.weightPct ?? 0,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    }));

    if (rest.length) {
      const otherPct = rest.reduce(
        (sum, e) => sum + (e.weightPct ?? 0),
        0
      );
      result.push({
        label: "Other",
        weightPct: otherPct,
        color: COLOR_PALETTE[result.length % COLOR_PALETTE.length],
      });
    }

    return result;
  }, [sorted, total]);

  // Legend display values: force "Other" = 100 - roundedSum(main)
  const displayPercents: number[] = React.useMemo(() => {
    if (!slices.length) return [];

    const lastIndex = slices.length - 1;
    const hasOther = slices[lastIndex]?.label === "Other";

    // If there's no "Other" slice, just round everything normally
    if (!hasOther) {
      return slices.map((slice) => Math.round(slice.weightPct ?? 0));
    }

    // Round main slices (all except "Other")
    const baseRounded = slices.map((slice, index) =>
      index === lastIndex ? 0 : Math.round(slice.weightPct ?? 0)
    );

    const sumMain = baseRounded
      .slice(0, lastIndex)
      .reduce((sum, value) => sum + value, 0);

    // Other is whatever remains to reach 100
    baseRounded[lastIndex] = Math.max(0, 100 - sumMain);

    return baseRounded;
  }, [slices]);

  // NEW: compute how much of the portfolio the top 5 represent (using true decimals)
  const topFivePct = React.useMemo(() => {
    if (!sorted.length || total <= 0) return 0;
    const MAX_SLICES = 6;
    const main = sorted.slice(0, MAX_SLICES - 1); // top 5 rows
    return main.reduce((sum, e) => sum + (e.weightPct ?? 0), 0);
  }, [sorted, total]);

  const RADIUS = 80;
  const STROKE_WIDTH = 26;
  const CENTER = 110;
  const CIRC = 2 * Math.PI * RADIUS;

  const [animationProgress, setAnimationProgress] = React.useState(0);

  React.useEffect(() => {
    let frame: number;
    const duration = 550;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      setAnimationProgress(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [normalized]);

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const hoveredSlice =
    hoveredIndex != null ? slices[hoveredIndex] : null;

  let cumulative = 0;

  // Small arc gap (in SVG units) to create a white separator between slices
  const SEPARATOR = 2; // tweak 1–3 if you want thinner/thicker white lines

  return (
    <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
      {/* Donut */}
      <div className="relative h-56 w-56 md:h-60 md:w-60">
        <svg viewBox="0 0 220 220" className="h-full w-full">
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {slices.map((slice, index) => {
              const basePct = total > 0 ? slice.weightPct / total : 0;
              const pct = basePct * animationProgress;
              const rawDash = pct * CIRC;

              // shorten each arc slightly so the background shows between slices
              const dash = Math.max(0, rawDash - SEPARATOR);
              const gap = CIRC - dash;
              const offset = -cumulative * CIRC;
              cumulative += basePct;

              return (
                <circle
                  key={`${slice.label}-${index}`}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="mt-0.5 text-base font-semibold text-neutral-900 md:text-[15px]">
            {classification}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500 tabular-nums">
            Top 5 represent {fmtPercent(topFivePct)}%
          </p>
        </div>

        {/* Hover tooltip */}
        {hoveredSlice && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-[11px] text-white shadow-lg backdrop-blur-sm">
            <span className="font-medium">{hoveredSlice.label}</span>
            <span className="ml-1 tabular-nums text-white/80">
              {fmtPercent(hoveredSlice.weightPct)}%
            </span>
          </div>
        )}
      </div>

      {/* Breakdown list with % badges */}
      <div className="flex-1 space-y-3">
        {showHeader && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-neutral-900">
              Exposure breakdown
            </h3>
            <p className="text-sm text-neutral-700">
              Bright slices show your heaviest tilts. The rest is grouped as
              “Other”.
            </p>
          </div>
        )}

        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          % of your portfolio
        </p>

        <ul className="space-y-1.5">
          {slices.map((slice, index) => (
            <li
              key={`${slice.label}-${index}`}
              className="flex items-center justify-between gap-4 py-1.5"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Left: label with responsive text */}
              <div className="flex min-w-0 flex-1 items-center gap-2 text-xs sm:text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-sm font-medium text-neutral-900">
                  {slice.label}
                </span>
              </div>

              {/* Right: Apple-like fixed-width % badge, using adjusted displayPercents */}
              <span
                className="
                  inline-flex
                  min-w-[2.9rem]
                  shrink-0
                  justify-end
                  px-2 py-1
                  rounded-full
                  text-[13px]
                  leading-none
                  font-medium
                  text-white
                  tabular-nums
                  backdrop-blur-sm
                  ring-1 ring-white/20
                "
                style={{ backgroundColor: slice.color }}
              >
                {(displayPercents[index] ?? Math.round(slice.weightPct ?? 0))}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
