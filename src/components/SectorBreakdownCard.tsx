"use client";

import { useMemo } from "react";
import type { ApiExposureRow } from "@/lib/exposureEngine";
import { aggregateBySector } from "@/lib/exposureAggregations";
import { useBenchmarkExposure } from "@/hooks/useBenchmarkExposure";
import { calculateTilts, type GroupExposure } from "@/lib/benchmarkTilts";
import BenchmarkTiltSection from "@/components/BenchmarkTiltSection";

type SectorBreakdownCardProps = {
  exposure: ApiExposureRow[];
  benchmarkSymbol: string;
  benchmarkLabel: string;
};

const SECTOR_GRADIENTS = [
  "from-emerald-500 via-emerald-400 to-emerald-300",
  "from-blue-500 via-blue-400 to-blue-300",
  "from-violet-500 via-violet-400 to-violet-300",
  "from-rose-500 via-rose-400 to-rose-300",
  "from-amber-500 via-amber-400 to-amber-300",
  "from-fuchsia-500 via-fuchsia-400 to-fuchsia-300",
  "from-cyan-500 via-cyan-400 to-cyan-300",
];

export function SectorBreakdownCard({
  exposure,
  benchmarkSymbol,
  benchmarkLabel,
}: SectorBreakdownCardProps) {
  const sectors = aggregateBySector(exposure);
  const topSectors = sectors.slice(0, 5);
  const othersCount = Math.max(sectors.length - topSectors.length, 0);
  const maxWeight = topSectors[0]?.weightPct ?? 0;
  const sectorExposureForTilts = useMemo<GroupExposure[]>(
    () =>
      sectors.map((sector) => ({
        label: sector.sector,
        weightPct: sector.weightPct,
      })),
    [sectors],
  );

  const {
    data: benchmarkRows,
    isLoading: isBenchmarkLoading,
    error: benchmarkError,
  } = useBenchmarkExposure(benchmarkSymbol, "sector");

  const { overweights, underweights } = useMemo(
    () => calculateTilts(sectorExposureForTilts, benchmarkRows),
    [sectorExposureForTilts, benchmarkRows],
  );

  if (!topSectors.length) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 text-xs text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
        <p>No sector data available for this mix.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mb-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          The industries you are most exposed to
        </h3>
      </div>
      <div className="space-y-3">
        {topSectors.map((sector, index) => {
          const gradient = SECTOR_GRADIENTS[index % SECTOR_GRADIENTS.length];

          return (
            <div key={sector.sector} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {sector.sector}
                </span>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                  {sector.weightPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100/60 dark:bg-zinc-800/60">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${gradient} shadow-sm`}
                  style={{
                    width: `${
                      maxWeight > 0 ? (sector.weightPct / maxWeight) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          );
        })}
        {othersCount > 0 && (
          <p className="pt-1 text-xs text-zinc-500 dark:text-zinc-400">
            +{othersCount} smaller sectors
          </p>
        )}
      </div>

      <BenchmarkTiltSection
        title={`Tilts vs ${benchmarkLabel} by sector`}
        contextLabel="sector"
        benchmarkLabel={benchmarkLabel}
        overweights={overweights}
        underweights={underweights}
        isLoading={isBenchmarkLoading}
        error={benchmarkError}
      />
    </section>
  );
}
