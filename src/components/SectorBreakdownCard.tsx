"use client";

import { useState } from "react";

import type { ApiExposureRow } from "@/lib/exposureEngine";
import { aggregateBySector } from "@/lib/exposureAggregations";

type SectorBreakdownCardProps = {
  exposure: ApiExposureRow[];
};

const VISIBLE_SECTORS_COUNT = 5;
const SECTOR_GRADIENTS = [
  "from-emerald-500 via-emerald-400 to-emerald-300",
  "from-blue-500 via-blue-400 to-blue-300",
  "from-violet-500 via-violet-400 to-violet-300",
  "from-rose-500 via-rose-400 to-rose-300",
  "from-amber-500 via-amber-400 to-amber-300",
  "from-fuchsia-500 via-fuchsia-400 to-fuchsia-300",
  "from-cyan-500 via-cyan-400 to-cyan-300",
];

export function SectorBreakdownCard({ exposure }: SectorBreakdownCardProps) {
  const [showAllSectors, setShowAllSectors] = useState(false);
  const sectors = aggregateBySector(exposure);
  const visibleSectors = showAllSectors
    ? sectors
    : sectors.slice(0, VISIBLE_SECTORS_COUNT);
  const hiddenSectorsCount = Math.max(
    sectors.length - VISIBLE_SECTORS_COUNT,
    0
  );
  const shouldShowToggle = hiddenSectorsCount > 0;
  const maxWeight = sectors[0]?.weightPct ?? 0;

  if (!sectors.length) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700 shadow-sm">
        <p>No sector data available for this mix.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-neutral-900">
          The industries you are most exposed to
        </h3>
      </div>
      <div className="space-y-3">
        {visibleSectors.map((sector, index) => {
          const gradient = SECTOR_GRADIENTS[index % SECTOR_GRADIENTS.length];

          return (
            <div key={sector.sector} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-900">
                  {sector.sector}
                </span>
                <span className="tabular-nums text-neutral-700">
                  {sector.weightPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100/60">
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
      </div>
      {shouldShowToggle && (
        <div className="mt-3 flex justify-center border-t border-neutral-100/80 pt-2 md:justify-end">
          <button
            type="button"
            onClick={() => setShowAllSectors((prev) => !prev)}
            className="text-xs font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            {showAllSectors
              ? "Show fewer"
              : `+ Show ${hiddenSectorsCount} more`}
          </button>
        </div>
      )}
    </section>
  );
}
