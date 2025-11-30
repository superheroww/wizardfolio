"use client";

import { useMemo, useState } from "react";
import { type BenchmarkExposureRow } from "@/lib/benchmarkExposure";
import { useBenchmarkExposure } from "@/hooks/useBenchmarkExposure";

type BenchmarkExposureCardProps = {
  benchmarkSymbol: string;
};

type ExposureGroup = "stock" | "sector" | "region";

const TAB_CONFIGS: {
  groupBy: ExposureGroup;
  label: string;
  caption: (symbol: string) => string;
}[] = [
  {
    groupBy: "stock",
    label: "Stocks",
    caption: (symbol) => `Top 5 stocks in ${symbol}`,
  },
  {
    groupBy: "sector",
    label: "Sectors",
    caption: (symbol) => `Top 10 sectors in ${symbol}`,
  },
  {
    groupBy: "region",
    label: "Regions",
    caption: (symbol) => `Top 10 regions in ${symbol}`,
  },
];

const formatPercent = (value: number) => {
  const formatted = value.toFixed(1);
  return `${formatted.replace(/\\.0$/, "")}%`;
};

export default function BenchmarkExposureCard({
  benchmarkSymbol,
}: BenchmarkExposureCardProps) {
  const [activeTab, setActiveTab] = useState<ExposureGroup>("stock");
  const { data, isLoading, error } = useBenchmarkExposure(
    benchmarkSymbol,
    activeTab,
  );

  const filteredRows = useMemo<BenchmarkExposureRow[]>(() => {
    if (activeTab !== "stock") {
      return data;
    }

    const unique: BenchmarkExposureRow[] = [];
    const seen = new Set<string>();

    for (const row of data) {
      const label = row.group_key;
      if (seen.has(label)) continue;
      seen.add(label);
      unique.push(row);
      if (unique.length >= 5) break;
    }

    return unique;
  }, [data, activeTab]);

  const displayRows = filteredRows;
  const maxRowPct = useMemo(
    () => Math.max(...displayRows.map((row) => row.weight_pct), 0),
    [displayRows],
  );

  const activeTabConfig =
    TAB_CONFIGS.find((tab) => tab.groupBy === activeTab) ?? TAB_CONFIGS[0];

  const cardTitle =
    activeTab === "stock"
      ? `Top 5 stocks in ${benchmarkSymbol || "the benchmark"}`
      : `See how ${benchmarkSymbol || "the benchmark"} is allocated`;

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Benchmark exposure
        </p>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {cardTitle}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-300">
          Based on {benchmarkSymbol || "the benchmark"}’s own holdings.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TAB_CONFIGS.map((tab) => (
          <button
            key={tab.groupBy}
            type="button"
            onClick={() => setActiveTab(tab.groupBy)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              activeTab === tab.groupBy
                ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {activeTabConfig.caption(benchmarkSymbol || "the benchmark")}
      </p>

      {isLoading && (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
          Loading benchmark exposure…
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs text-rose-600 dark:border-rose-400/50 dark:bg-rose-900/40 dark:text-rose-200">
          {error}
        </div>
      )}

      {!isLoading && !error && !displayRows.length && (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
          No benchmark exposure data found.
        </div>
      )}

      {!isLoading && displayRows.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {displayRows.map((row, index) => {
              const widthPct =
                maxRowPct > 0
                  ? Math.min(100, (row.weight_pct / maxRowPct) * 100)
                  : 0;

              return (
                <div
                  key={`${row.group_key}-${row.weight_pct}-${index}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">{row.group_key}</span>
                    <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatPercent(row.weight_pct)}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800"
                    aria-hidden="true"
                  >
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 shadow-sm"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
