"use client";

import { useMemo, useState } from "react";

export type ApiExposureRow = {
  holding_symbol: string;
  holding_name: string;
  country?: string | null;
  sector?: string | null;
  asset_class?: string | null;
  total_weight_pct: number;
};

type NormalizedHolding = {
  symbol: string;
  weightPct: number;
};

type HoldingsTableProps = {
  // Now expects the raw rows coming back from /api/etf-exposure
  exposure: ApiExposureRow[];
  showHeader?: boolean;
  className?: string;
};

export default function HoldingsTable({
  exposure,
  showHeader = true,
  className = "",
}: HoldingsTableProps) {
  const [showAll, setShowAll] = useState(false);

  // Normalize API rows into the shape the table logic expects
  const normalized = useMemo<NormalizedHolding[]>(
    () =>
      (exposure ?? []).map((row) => ({
        symbol: row.holding_symbol,
        weightPct: row.total_weight_pct,
      })),
    [exposure]
  );

  const limit = 5;
  const visibleHoldings = showAll ? normalized : normalized.slice(0, limit);
  const remainingCount = Math.max(
    0,
    normalized.length - visibleHoldings.length
  );
  const shouldShowToggle = normalized.length > limit;

  if (!normalized || normalized.length === 0) return null;

  const rootClassName =
    "w-full rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80";

  return (
    <section className={`${rootClassName} ${className}`}>
      {showHeader && (
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Holdings breakdown</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Full list of assets after ETF look-through.
            </p>
          </div>
        </header>
      )}

      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="py-2">Ticker</th>
              <th className="py-2 text-right">Exposure %</th>
            </tr>
          </thead>
          <tbody>
            {visibleHoldings.map((item) => (
              <tr
                key={item.symbol}
                className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
              >
                <td className="py-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {item.symbol}
                </td>
                <td className="py-2 text-right text-sm text-zinc-700 dark:text-zinc-200">
                  {item.weightPct.toFixed(2).replace(/\.0$/, "")}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">
          <span>Ticker</span>
          <span>% Exposure</span>
        </div>
        {visibleHoldings.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/70"
          >
            <span className="font-medium text-zinc-800 dark:text-zinc-50">
              {item.symbol}
            </span>
            <span className="text-zinc-700 dark:text-zinc-200">
              {item.weightPct.toFixed(2).replace(/\.0$/, "")}%
            </span>
          </div>
        ))}
      </div>

      {shouldShowToggle && (
        <div className="mt-3 flex justify-center border-t border-zinc-100/80 pt-2 dark:border-zinc-800 md:justify-end">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs font-semibold text-zinc-700 underline underline-offset-2 dark:text-zinc-200"
          >
            {showAll
              ? "Show fewer"
              : `+ Show ${remainingCount > 0 ? remainingCount : 0} more`}
          </button>
        </div>
      )}
    </section>
  );
}
