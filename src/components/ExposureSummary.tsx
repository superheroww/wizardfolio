"use client";

import * as React from "react";
import { ExposureBreakdown } from "@/lib/exposureEngine";

type ExposureSummaryProps = {
  exposure: ExposureBreakdown[];
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

type EtfProfile = {
  techScore: number;
  usShare: number;
  caShare: number;
  intlShare: number;
  isBond: boolean;
};

const fmtPercent = (value: number | null | undefined) =>
  (value ?? 0).toFixed(1).replace(/\.0$/, "");

function getSymbolProfile(symbolRaw: string | undefined): EtfProfile {
  const base: EtfProfile = {
    techScore: 0.2,
    usShare: 0.4,
    caShare: 0.1,
    intlShare: 0.5,
    isBond: false,
  };

  if (!symbolRaw) return base;

  const symbol = symbolRaw.trim().toUpperCase();
  const plain = symbol.replace(".TO", "");
  const isAny = (...codes: string[]) => codes.includes(plain);

  if (isAny("BND", "ZAG", "XBB", "VAB")) {
    return { techScore: 0, usShare: 0, caShare: 0, intlShare: 0, isBond: true };
  }

  if (isAny("SPY", "VOO", "IVV", "ZSP", "HXS", "VFV", "VFV.TO")) {
    return {
      techScore: 0.4,
      usShare: 0.9,
      caShare: 0,
      intlShare: 0.1,
      isBond: false,
    };
  }

  if (isAny("QQQ", "QQQM", "ZQQ", "HXQ")) {
    return {
      techScore: 1.0,
      usShare: 0.95,
      caShare: 0,
      intlShare: 0.05,
      isBond: false,
    };
  }

  if (isAny("VEQT", "XEQT", "VEQT.TO", "XEQT.TO")) {
    return {
      techScore: 0.3,
      usShare: 0.4,
      caShare: 0.25,
      intlShare: 0.35,
      isBond: false,
    };
  }

  if (isAny("VGRO", "VBAL", "VGRO.TO", "VBAL.TO", "XGRO", "XBAL")) {
    return {
      techScore: 0.2,
      usShare: 0.35,
      caShare: 0.25,
      intlShare: 0.4,
      isBond: false,
    };
  }

  if (isAny("XIU", "ZCN", "VCN", "XIC")) {
    return {
      techScore: 0.1,
      usShare: 0,
      caShare: 0.9,
      intlShare: 0.1,
      isBond: false,
    };
  }

  if (isAny("XEF", "ZEA", "VIU")) {
    return {
      techScore: 0.15,
      usShare: 0,
      caShare: 0,
      intlShare: 1.0,
      isBond: false,
    };
  }

  if (isAny("XEC", "ZEM", "VEE")) {
    return {
      techScore: 0.1,
      usShare: 0,
      caShare: 0,
      intlShare: 1.0,
      isBond: false,
    };
  }

  if (isAny("SCHD", "VDY", "ZDY")) {
    return {
      techScore: 0.15,
      usShare: 0.7,
      caShare: plain === "VDY" ? 0.6 : 0,
      intlShare: plain === "VDY" ? 0.4 : 0.3,
      isBond: false,
    };
  }

  return base;
}

function classifyExposure(exposure: ExposureBreakdown[]): string {
  if (!exposure.length) return "Diversified";

  let equityPct = 0;
  let bondPct = 0;
  let techTiltScore = 0;
  let usPct = 0;
  let caPct = 0;
  let intlPct = 0;

  for (const pos of exposure) {
    const weight = pos.weightPct ?? 0;
    if (weight <= 0) continue;

    const profile = getSymbolProfile(pos.symbol);
    if (profile.isBond) {
      bondPct += weight;
    } else {
      equityPct += weight;
      techTiltScore += weight * profile.techScore;
      usPct += weight * profile.usShare;
      caPct += weight * profile.caShare;
      intlPct += weight * profile.intlShare;
    }
  }

  const total = equityPct + bondPct || 1;
  const normEquity = (equityPct / total) * 100;
  const normBonds = (bondPct / total) * 100;
  const normTechTilt = techTiltScore / total;
  const normUS = usPct / total;
  const normCA = caPct / total;
  const normIntl = intlPct / total;

  if (normTechTilt > 0.3) return "Tech-Tilted";
  if (normTechTilt > 0.2) return "Light Tech Lean";

  if (normUS > 0.5) return "U.S.-Concentrated";
  if (normCA > 0.35) return "Canada-Tilted";
  if (normIntl > 0.4) return "International-Heavy";

  if (normEquity > 80) return "Equity-Heavy";
  if (normEquity > 60) return "Growth-Oriented";
  if (normEquity < 40 && normBonds > 30) return "Conservative";

  return "Diversified";
}

export default function ExposureSummary({
  exposure,
  showHeader = true,
}: ExposureSummaryProps) {
  const sorted = React.useMemo(
    () => [...exposure].sort((a, b) => (b.weightPct ?? 0) - (a.weightPct ?? 0)),
    [exposure]
  );

  const total = React.useMemo(
    () => sorted.reduce((sum, e) => sum + (e.weightPct ?? 0), 0),
    [sorted]
  );

  const classification = React.useMemo(
    () => classifyExposure(exposure),
    [exposure]
  );

  const slices: Slice[] = React.useMemo(() => {
    if (!sorted.length || total <= 0) return [];

    const MAX_SLICES = 6;
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
  }, [exposure]);

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const hoveredSlice =
    hoveredIndex != null ? slices[hoveredIndex] : null;

  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
      

      {/* Donut */}
      <div className="relative h-56 w-56">
        <svg viewBox="0 0 220 220" className="h-full w-full">
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {slices.map((slice, index) => {
              const basePct =
                total > 0 ? slice.weightPct / total : 0;
              const pct = basePct * animationProgress;
              const dash = pct * CIRC;
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <p className="mt-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            {classification}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {fmtPercent(total)}% • Top weights only
          </p>
        </div>

        {/* Hover tooltip */}
        {hoveredSlice && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-[11px] text-white shadow-lg dark:bg-black/90">
            <span className="font-semibold">
              {hoveredSlice.label}
            </span>
            <span className="ml-1 text-white/80">
              {fmtPercent(hoveredSlice.weightPct)}%
            </span>
          </div>
        )}
      </div>

      {/* Breakdown list */}
      <div className="flex-1 space-y-3">
        {showHeader && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Exposure breakdown
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Bright slices show your heaviest tilts. The rest is grouped as
              “Other”.
            </p>
          </div>
        )}

        <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          % of your portfolio
        </p>

<ul className="space-y-1.5">
  {slices.map((slice, index) => (
    <li
      key={`${slice.label}-${index}`}
      className="flex items-center justify-between"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Left: label with responsive text */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: slice.color }}
        />
        <span className="font-medium text-zinc-800 dark:text-zinc-100">
          {slice.label}
        </span>
      </div>

      {/* Right: fixed-width % badge */}
<span
  className="
    inline-flex 
    w-12
    justify-end
    px-2 py-1
    rounded-full
    text-[13px]
    font-medium
    leading-none
    text-white
    tabular-nums
    backdrop-blur-sm
    bg-white/10
    ring-1 ring-white/20
  "
  style={{ backgroundColor: slice.color }}
>
  {fmtPercent(slice.weightPct)}%
</span>


    </li>
  ))}
</ul>



        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
          Showing top {Math.min(slices.length, 6)} exposures in a clean view.
        </p>
      </div>
    </div>
  );
}