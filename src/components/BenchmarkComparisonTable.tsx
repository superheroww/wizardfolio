import React from "react";

export type BenchmarkRow = {
  label: string;
  symbol?: string;
  yourWeightPct: number;
  benchmarkWeightPct: number;
  diffPct: number;
};

export type BenchmarkComparisonTableProps = {
  title?: string;
  rows: BenchmarkRow[];
  variant?: "default" | "stock";
  hideEmpty?: boolean;
};

const formatPercent = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1)}%`;
};

const getDiffMeta = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;

  if (safeValue > 0) {
    return {
      direction: "up" as const,
      colorClass: "text-emerald-600",
      icon: "↑",
      absValue: Math.abs(safeValue),
    };
  }

  if (safeValue < 0) {
    return {
      direction: "down" as const,
      colorClass: "text-rose-500",
      icon: "↓",
      absValue: Math.abs(safeValue),
    };
  }

  return {
    direction: "flat" as const,
    colorClass: "text-neutral-500",
    icon: "",
    absValue: 0,
  };
};

export default function BenchmarkComparisonTable({
  title,
  rows,
  variant = "default",
  hideEmpty,
}: BenchmarkComparisonTableProps) {
  if (hideEmpty && rows.length === 0) return null;

  return (
    <section className="space-y-2">
      {title ? (
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        {/* 📱 Mobile layout: stacked cards, no horizontal scroll */}
        <div className="space-y-3 sm:hidden">
          {rows.map((row) => {
            const showSymbol =
              row.symbol &&
              row.symbol.toUpperCase() !== row.label.toUpperCase();

            const { direction, colorClass, icon, absValue } = getDiffMeta(
              row.diffPct,
            );

            return (
              <div
                key={`${row.label}-${row.symbol ?? ""}`}
                className="rounded-xl border border-neutral-100 bg-white/80 px-3 py-2.5"
              >
                <div className="mb-1 flex flex-col">
                  <span className="truncate text-sm font-medium text-neutral-900">
                    {row.label}
                  </span>
                  {showSymbol && (
                    <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                      {row.symbol}
                    </span>
                  )}
                </div>

                <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-neutral-600">
                  <div className="space-y-0.5">
                    <p className="uppercase tracking-[0.08em]">Your mix</p>
                    <p className="tabular-nums text-xs font-medium text-neutral-900">
                      {formatPercent(row.yourWeightPct)}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-center">
                    <p className="uppercase tracking-[0.08em]">Benchmark</p>
                    <p className="tabular-nums text-xs font-medium text-neutral-900">
                      {formatPercent(row.benchmarkWeightPct)}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="uppercase tracking-[0.08em]">Diff</p>
                    <p
                      className={[
                        "inline-flex items-center justify-end gap-1 tabular-nums text-xs font-semibold",
                        colorClass,
                      ].join(" ")}
                    >
                      {direction !== "flat" && (
                        <span className="text-[10px]" aria-hidden="true">
                          {icon}
                        </span>
                      )}
                      <span>{`${absValue.toFixed(1)}%`}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 💻 Desktop layout: premium table */}
        <div className="hidden sm:block">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.08em] text-neutral-500">
              <tr>
                <th className="px-3 pb-2 font-medium">Name</th>
                <th className="px-3 pb-2 text-right font-medium">Your mix</th>
                <th className="px-3 pb-2 text-right font-medium">Benchmark</th>
                <th className="px-3 pb-2 text-right font-medium">Diff</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const showSymbol =
                  row.symbol &&
                  row.symbol.toUpperCase() !== row.label.toUpperCase();

                const { direction, colorClass, icon, absValue } = getDiffMeta(
                  row.diffPct,
                );

                return (
                  <tr
                    key={`${row.label}-${row.symbol ?? ""}`}
                    className="border-t border-neutral-100 text-xs text-neutral-900 transition-colors hover:bg-neutral-50 sm:text-sm"
                  >
                    <td className="max-w-[240px] px-3 py-3">
                      <div className="flex flex-col">
                        <span className="truncate font-medium text-neutral-900">
                          {row.label}
                        </span>
                        {showSymbol && (
                          <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                            {row.symbol}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums text-neutral-900">
                      {formatPercent(row.yourWeightPct)}
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums text-neutral-900">
                      {formatPercent(row.benchmarkWeightPct)}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <span
                        className={[
                          "inline-flex items-center justify-end gap-1 tabular-nums text-sm font-semibold",
                          colorClass,
                        ].join(" ")}
                      >
                        {direction !== "flat" && (
                          <span className="text-[11px]" aria-hidden="true">
                            {icon}
                          </span>
                        )}
                        <span>{`${absValue.toFixed(1)}%`}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}