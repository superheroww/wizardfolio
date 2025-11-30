"use client";

import { ChangeEvent } from "react";
import type { BenchmarkMix } from "@/lib/benchmarkPresets";
import type { MixComparisonResult } from "@/lib/benchmarkEngine";

type BenchmarkComparisonCardProps = {
  userLabel: string;
  benchmark: BenchmarkMix;
  comparison: MixComparisonResult | null;
  benchmarks: BenchmarkMix[];
  onBenchmarkChange?: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
};

const formatPercent = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
};

const DIFF_THRESHOLD = 5;

type TakeawayOpts = {
  benchmarkLabel: string;
  overlapPct: number;
  visibleCount: number;
  overweights: { ticker: string; deltaPct: number }[];
  underweights: { ticker: string; deltaPct: number }[];
};

const buildTakeaway = ({
  benchmarkLabel,
  overlapPct,
  visibleCount,
  overweights,
  underweights,
}: TakeawayOpts): string | null => {
  if (visibleCount > 0 && overlapPct >= 70) {
    return `Your mix behaves very similarly to ${benchmarkLabel} within its top ${visibleCount} holdings.`;
  }

  if (visibleCount > 0 && overlapPct >= 40) {
    return `Your mix shares some of the biggest positions with ${benchmarkLabel}, but there are meaningful differences within the fund's top holdings.`;
  }

  const topOver = overweights[0];
  const topUnder = underweights[0];

  if (topOver && topUnder) {
    return `You’re slightly heavier in ${topOver.ticker} and lighter in ${topUnder.ticker} vs ${benchmarkLabel}.`;
  }

  if (topOver) {
    return `You’re slightly heavier in ${topOver.ticker} vs ${benchmarkLabel}.`;
  }

  if (topUnder) {
    return `You’re slightly lighter in ${topUnder.ticker} vs ${benchmarkLabel}.`;
  }

  return null;
};

export default function BenchmarkComparisonCard({
  userLabel,
  benchmark,
  comparison,
  benchmarks,
  onBenchmarkChange,
  isLoading = false,
  error,
}: BenchmarkComparisonCardProps) {
  const overlapPct = comparison?.overlapPct ?? 0;
  const differencePct = comparison?.differencePct ?? 0;
  const coveragePct = comparison?.coveragePct ?? 0;
  const visibleCount = comparison?.visibleCount ?? 0;
  const overweights = comparison?.overweights ?? [];
  const underweights = comparison?.underweights ?? [];
  const overlapWidth = Math.min(100, Math.max(0, overlapPct));
  const overweightList = overweights.slice(0, 4);
  const underweightList = underweights.slice(0, 3);
  const isSimpleMode = comparison ? differencePct < DIFF_THRESHOLD : false;
  const takeaway = comparison
    ? buildTakeaway({
        benchmarkLabel: benchmark.label,
        overlapPct,
        visibleCount,
        overweights,
        underweights,
      })
    : null;
  const labelSlice =
    visibleCount >= 60
      ? "Top-60"
      : visibleCount > 0
        ? `Top-${visibleCount}`
        : "Top holdings";
  const visibleHoldingsText =
    visibleCount > 0 ? `top ${visibleCount} disclosed holdings` : "top disclosed holdings";
  const hasOverweights = overweightList.length > 0;
  const hasUnderweights = underweightList.length > 0;
  const onlyUnderweights = !hasOverweights && hasUnderweights;
  const onlyUnderweightSummary = onlyUnderweights
    ? `Compared to ${benchmark.label}, your mix is less concentrated in its biggest names. ${benchmark.label.split(
        " ",
      )[0]} holds much more of stocks like ${
        underweightList[0]?.ticker ?? "its top holdings"
      }.`
    : null;
  const summaryText = onlyUnderweightSummary ?? takeaway;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (onBenchmarkChange) {
      onBenchmarkChange(event.target.value);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Benchmark comparison
          </p>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {userLabel} vs {benchmark.label}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-300">
            {benchmark.description}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 text-xs">
          <label className="text-zinc-500 dark:text-zinc-400">Benchmark</label>
          <div className="relative inline-flex w-full min-w-[150px] rounded-full border border-zinc-200 bg-white px-3 py-1 text-left text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-50">
            <select
              value={benchmark.id}
              onChange={handleChange}
              className="appearance-none w-full bg-transparent text-left text-sm font-semibold text-zinc-900 outline-none dark:text-zinc-50"
            >
              {benchmarks.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 dark:text-zinc-400">
              ▾
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
        <p>
          {labelSlice} overlap:{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {comparison ? `${formatPercent(overlapPct)}` : "—"}
          </span>{" "}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
            style={{ width: `${overlapWidth}%` }}
          />
        </div>
      </div>

      {isLoading && !error && (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
          Fetching benchmark exposure…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs text-rose-600 dark:border-rose-400/50 dark:bg-rose-900/40 dark:text-rose-200">
          {error}
        </div>
      )}

      {comparison && !isLoading && !error && (
        <>
          {isSimpleMode ? (
            <div className="space-y-3">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <span>High similarity</span>
                <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                  • {formatPercent(overlapPct)} overlap
                </span>
              </div>
              {takeaway && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{takeaway}</p>
              )}
            </div>
          ) : (
            <>
              {summaryText && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
                  {summaryText}
                </p>
              )}
              <div
                className={`grid gap-4 ${onlyUnderweights ? "" : "sm:grid-cols-2"}`}
              >
                {!onlyUnderweights && (
                  <ComparisonList
                    title="Overweights"
                    items={overweightList}
                    emptyText={`No meaningful overweights vs ${benchmark.label}.`}
                    isPositive
                  />
              )}
              <ComparisonList
                title={
                  onlyUnderweights
                    ? "Where the benchmark is heavier"
                    : "Underweights"
                }
                items={underweightList}
                emptyText={`No meaningful underweights vs ${benchmark.label}.`}
              />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              “Overweights” lists holdings where your mix has more exposure than {benchmark.label}; “Underweights” lists holdings where it has less.
            </p>
          </>
        )}
      </>
      )}

      {comparison && (
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          Based on each ETF’s {visibleHoldingsText}, normalized to 100% for this
          comparison. Smaller positions in the fund are not included in this
          view.
        </p>
      )}
    </section>
  );
}

type ComparisonListItem = {
  ticker: string;
  deltaPct: number;
};

type ComparisonListProps = {
  title: string;
  items: ComparisonListItem[];
  emptyText: string;
  isPositive?: boolean;
};

function ComparisonList({
  title,
  items,
  emptyText,
  isPositive = false,
}: ComparisonListProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-zinc-100 bg-white/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      {items.length ? (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.ticker}
              className="flex items-center justify-between font-medium text-zinc-900 dark:text-zinc-50"
            >
              <span>{item.ticker}</span>
              <span
                className={[
                  "text-xs font-semibold",
                  isPositive ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400",
                ].join(" ")}
              >
                {item.deltaPct > 0 ? `+${item.deltaPct.toFixed(1)}%` : `${item.deltaPct.toFixed(1)}%`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{emptyText}</p>
      )}
    </div>
  );
}
