"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import type { ApiExposureRow } from "@/lib/exposureEngine";
import type { BenchmarkMix } from "@/lib/benchmarkPresets";
import { getBenchmarkLabel } from "@/lib/benchmarkUtils";
import type { MixComparisonResult } from "@/lib/benchmarkEngine";
import {
  aggregateByRegion,
  aggregateBySector,
  aggregateHoldingsBySymbol,
} from "@/lib/exposureAggregations";
import type { BenchmarkExposureRow } from "@/lib/benchmarkExposure";
import BenchmarkComparisonTable, {
  type BenchmarkRow,
} from "@/components/BenchmarkComparisonTable";
import { buildBenchmarkRows, type RawExposureRow } from "@/lib/benchmarkDiffs";
import type { GroupExposure } from "@/lib/benchmarkTilts";
import { formatMixSummary } from "@/lib/mixFormatting";
import type { RecentMix } from "@/hooks/useRecentMixes";

type ExposureTab = "stock" | "sector" | "region";

type CompareTarget =
  | { type: "benchmark"; benchmarkId: string }
  | { type: "previous"; mix: RecentMix };

const EXPOSURE_TABS: { id: ExposureTab; label: string }[] = [
  { id: "stock", label: "Stocks" },
  { id: "sector", label: "Sectors" },
  { id: "region", label: "Regions" },
];

type BenchmarkComparisonCardProps = {
  userLabel: string;
  benchmark: BenchmarkMix;
  comparison: MixComparisonResult | null;
  benchmarks: BenchmarkMix[];
  onBenchmarkChange?: (id: string) => void;
  exposure: ApiExposureRow[];
  userExposureMix: { ticker: string; weightPct: number }[];
  singleSymbol?: string | null;
  mixName: string;
  positionsCount: number;
  benchmarkSymbol: string;
  hasBenchmarkComparison: boolean;
  compareTarget: CompareTarget;
  benchmarkError?: string | null;
  isBenchmarkLoading?: boolean;
  targetExposure?: ApiExposureRow[];
};

const formatPercent = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
};

const MIN_TILT_DELTA = 0.05;

const normalizeKey = (value?: string) => value?.trim().toLowerCase() || "other";
const friendlyLabel = (value?: string) => value?.trim() || "Other";

type BuildGroupOptions = {
  includeSymbol?: boolean;
};

function buildGroupBenchmarkRows(
  userGroups: GroupExposure[] = [],
  benchmarkGroups: BenchmarkExposureRow[] = [],
  options: BuildGroupOptions = {},
): BenchmarkRow[] {
  const rows = new Map<string, RawExposureRow>();

  for (const entry of userGroups ?? []) {
    const key = normalizeKey(entry.label);
    if (!rows.has(key)) {
      rows.set(key, {
        label: friendlyLabel(entry.label),
        symbol: options.includeSymbol ? friendlyLabel(entry.label) : undefined,
        yourWeightPct: 0,
        benchmarkWeightPct: 0,
      });
    }

    const current = rows.get(key)!;
    current.yourWeightPct = entry.weightPct ?? 0;
  }

  for (const row of benchmarkGroups ?? []) {
    const key = normalizeKey(row.group_key);
    if (!rows.has(key)) {
      rows.set(key, {
        label: friendlyLabel(row.group_key),
        symbol: options.includeSymbol ? friendlyLabel(row.group_key) : undefined,
        yourWeightPct: 0,
        benchmarkWeightPct: 0,
      });
    }

    const current = rows.get(key)!;
    current.benchmarkWeightPct = row.weight_pct ?? 0;
  }

  const combined = Array.from(rows.values()).sort(
    (a, b) =>
      Math.max(b.yourWeightPct, b.benchmarkWeightPct) -
      Math.max(a.yourWeightPct, a.benchmarkWeightPct),
  );

  return buildBenchmarkRows(combined);
}

export default function BenchmarkComparisonCard({
  userLabel,
  benchmark,
  comparison,
  benchmarks,
  onBenchmarkChange,
  exposure,
  userExposureMix,
  singleSymbol,
  mixName,
  positionsCount,
  benchmarkSymbol: benchmarkSymbolProp,
  hasBenchmarkComparison,
  compareTarget,
  benchmarkError,
  isBenchmarkLoading = false,
  targetExposure = [],
}: BenchmarkComparisonCardProps) {
  const overlapPct = comparison?.overlapPct ?? 0;
  const labelSlice =
    (comparison?.visibleCount ?? 0) >= 60
      ? "Top-60"
      : comparison?.visibleCount && comparison.visibleCount > 0
        ? `Top-${comparison.visibleCount}`
        : "Top holdings";
  const visibleHoldingsText =
    comparison?.visibleCount
      ? `top ${comparison.visibleCount} disclosed holdings`
      : "top disclosed holdings";
  const overlapWidth = Math.min(100, Math.max(0, overlapPct));

  const [activeTab, setActiveTab] = useState<ExposureTab>("stock");
  const { capture } = usePostHogSafe();
  const benchmarkSymbol =
    benchmarkSymbolProp ??
    benchmark.positions?.[0]?.symbol ??
    benchmark.id;
  const benchmarkLabel = getBenchmarkLabel(benchmark);
  const previousMixSummary =
    compareTarget.type === "previous"
      ? formatMixSummary(compareTarget.mix.positions)
      : null;
  const comparisonLabelText =
    compareTarget.type === "benchmark"
      ? benchmarkLabel
      : previousMixSummary
        ? `previous mix (${previousMixSummary})`
        : "previous mix";
  const canChangeBenchmark =
    compareTarget.type === "benchmark" && Boolean(onBenchmarkChange);
  const normalizedSingleSymbol = singleSymbol?.trim().toUpperCase() ?? null;

  const handleTabChange = (tabId: ExposureTab) => {
    if (tabId === activeTab) {
      return;
    }

    capture("exposure_view_changed", {
      view_type: tabId,
      previous_view_type: activeTab,
      source_card: "benchmark_comparison",
      benchmark_symbol: benchmarkSymbol,
      benchmark_source: compareTarget.type,
      has_benchmark_enabled: hasBenchmarkComparison,
      mix_name: mixName,
      positions_count: positionsCount,
    });

    setActiveTab(tabId);
  };

  const normalizedTargetExposure = useMemo(
    () => targetExposure ?? [],
    [targetExposure],
  );

  const targetStockRowsData = useMemo<BenchmarkExposureRow[]>(() => {
    const aggregated = aggregateHoldingsBySymbol(normalizedTargetExposure);
    return aggregated.map((row) => {
      const holdingSymbol = (row as any).holding_symbol as string | undefined;
      const genericSymbol = (row as any).symbol as string | undefined;
      return {
        group_key:
          holdingSymbol?.trim().toUpperCase() ??
          genericSymbol?.trim().toUpperCase() ??
          "OTHER",
        weight_pct: row.total_weight_pct ?? 0,
      };
    });
  }, [normalizedTargetExposure]);

  const targetSectorRowsData = useMemo<BenchmarkExposureRow[]>(
    () =>
      aggregateBySector(normalizedTargetExposure).map((slice) => ({
        group_key: slice.sector,
        weight_pct: slice.weightPct,
      })),
    [normalizedTargetExposure],
  );

  const targetRegionRowsData = useMemo<BenchmarkExposureRow[]>(
    () =>
      aggregateByRegion(normalizedTargetExposure).map((slice) => ({
        group_key: slice.region,
        weight_pct: slice.weightPct,
      })),
    [normalizedTargetExposure],
  );

  const userStockExposure = useMemo<GroupExposure[]>(() => {
    return (userExposureMix ?? []).map((entry) => ({
      label: entry.ticker,
      weightPct: entry.weightPct,
    }));
  }, [userExposureMix]);

  const userSectorExposure = useMemo<GroupExposure[]>(() => {
    return aggregateBySector(exposure).map((slice) => ({
      label: slice.sector,
      weightPct: slice.weightPct,
    }));
  }, [exposure]);

  const userRegionExposure = useMemo<GroupExposure[]>(() => {
    return aggregateByRegion(exposure).map((slice) => ({
      label: slice.region,
      weightPct: slice.weightPct,
    }));
  }, [exposure]);

  const stockRows = useMemo(
    () =>
      buildGroupBenchmarkRows(userStockExposure, targetStockRowsData, {
        includeSymbol: true,
      }).filter((row) => Math.abs(row.diffPct) >= MIN_TILT_DELTA),
    [userStockExposure, targetStockRowsData],
  );

  const stockRowsSorted = useMemo(
    () =>
      [...stockRows].sort(
        (a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct),
      ),
    [stockRows],
  );

  const topFiveStockRows = useMemo(
    () => stockRowsSorted.slice(0, 5),
    [stockRowsSorted],
  );

  const stockOverweights = useMemo(
    () => topFiveStockRows.filter((row) => row.diffPct > 0.0001),
    [topFiveStockRows],
  );

  const stockUnderweights = useMemo(
    () => topFiveStockRows.filter((row) => row.diffPct < -0.0001),
    [topFiveStockRows],
  );

  const sectorRows = useMemo(
    () => buildGroupBenchmarkRows(userSectorExposure, targetSectorRowsData),
    [userSectorExposure, targetSectorRowsData],
  );

  const regionRows = useMemo(
    () => buildGroupBenchmarkRows(userRegionExposure, targetRegionRowsData),
    [userRegionExposure, targetRegionRowsData],
  );

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (onBenchmarkChange) {
      onBenchmarkChange(event.target.value);
    }
  };

const renderStockTables = () => {
  const hasRows =
    stockOverweights.length > 0 || stockUnderweights.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <p className="text-[11px] text-neutral-500">
          Your mix vs {comparisonLabelText} by stock
        </p>
        {isBenchmarkLoading && <span>Loading…</span>}
      </div>

      {hasRows ? (
        <div className="space-y-4">
          <BenchmarkComparisonTable
            title="Overweight stocks"
            rows={stockOverweights}
            variant="stock"
            hideEmpty
          />
          <BenchmarkComparisonTable
            title="Underweight stocks"
            rows={stockUnderweights}
            variant="stock"
            hideEmpty
          />
        </div>
      ) : (
        !isBenchmarkLoading &&
        !benchmarkError && (
          <p className="text-xs text-neutral-500">
            No meaningful tilts vs {comparisonLabelText}.
          </p>
        )
      )}
    </div>
  );
};


  const renderGroupTable = (rows: BenchmarkRow[], dimension: string) => {
    const hasRows = rows.length > 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <p className="text-[11px] text-neutral-500">
            Your mix vs {comparisonLabelText} by {dimension}
          </p>
          {isBenchmarkLoading && <span>Loading…</span>}
        </div>
        {hasRows ? (
          <BenchmarkComparisonTable
            rows={rows}
            variant="default"
            hideEmpty
          />
        ) : (
          !isBenchmarkLoading &&
          !benchmarkError && (
            <p className="text-xs text-neutral-500">
              No benchmark data available.
            </p>
          )
        )}
      </div>
    );
  };

  return (
    <section className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Benchmark comparison
          </p>
          <h3 className="text-base font-semibold text-neutral-900">
            {userLabel} vs {comparisonLabelText}
          </h3>
        </div>

        {canChangeBenchmark && (
          <div className="flex flex-col items-start gap-1 text-xs">
            <label className="text-xs text-neutral-500">Benchmark</label>
            <div className="relative inline-flex w-full min-w-[150px] rounded-full border border-neutral-200 bg-white px-3 py-1 text-left text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-300">
              <select
                value={benchmark.id}
                onChange={handleChange}
                className="w-full appearance-none bg-transparent text-left text-sm font-semibold text-neutral-900 outline-none"
              >
                {benchmarks.map((option) => {
                  const optionSymbol =
                    option.positions?.[0]?.symbol?.trim().toUpperCase() ??
                    option.id.toUpperCase();
                  const isDisabled = Boolean(
                    normalizedSingleSymbol &&
                      optionSymbol === normalizedSingleSymbol,
                  );

                  return (
                    <option
                      key={option.id}
                      value={option.id}
                      disabled={isDisabled}
                    >
                      {option.label}
                    </option>
                  );
                })}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                ▾
              </span>
            </div>
          </div>
        )}
      </div>

      {benchmarkError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-rose-600">
          {benchmarkError}
        </div>
      )}

      <div className="space-y-2 text-sm text-neutral-700">
        <p>
          {labelSlice} overlap:{" "}
          <span className="font-semibold text-neutral-900">
            {comparison ? `${formatPercent(overlapPct)}` : "—"}
          </span>{" "}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
            style={{ width: `${overlapWidth}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg.white/90 p-4">
        <div className="flex flex-wrap gap-2">
          {EXPOSURE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                activeTab === tab.id
                  ? "bg-neutral-900 text-white"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-100",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {activeTab === "stock" && renderStockTables()}
          {activeTab === "sector" && renderGroupTable(sectorRows, "sector")}
          {activeTab === "region" && renderGroupTable(regionRows, "region")}
        </div>
      </div>

      {comparison && (
        <p className="mt-1 text-[11px] text-neutral-500">
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
    <div className="space-y-2 rounded-2xl border border-neutral-100 bg-white/60 p-3 text-sm text-neutral-700">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
        {title}
      </p>
      {items.length ? (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.ticker}
              className="flex items-center justify-between text-sm font-medium text-neutral-900"
            >
              <span>{item.ticker}</span>
              <span
                className={[
                  "text-sm font-semibold",
                  isPositive ? "text-emerald-600" : "text-rose-600",
                ].join(" ")}
              >
                {item.deltaPct > 0
                  ? `+${item.deltaPct.toFixed(1)}%`
                  : `${item.deltaPct.toFixed(1)}%`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-500">{emptyText}</p>
      )}
    </div>
  );
}