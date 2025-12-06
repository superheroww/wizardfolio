"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import type { ApiExposureRow } from "@/lib/exposureEngine";
import type { BenchmarkMix } from "@/lib/benchmarkPresets";
import { getBenchmarkLabel } from "@/lib/benchmarkUtils";
import type { MixComparisonResult } from "@/lib/benchmarkEngine";
import { aggregateByRegion, aggregateBySector } from "@/lib/exposureAggregations";
import { useBenchmarkExposure } from "@/hooks/useBenchmarkExposure";
import type { BenchmarkExposureRow } from "@/lib/benchmarkExposure";
import ExposureComparisonRow from "@/components/ExposureComparisonRow";
import type { GroupExposure } from "@/lib/benchmarkTilts";

type ExposureTab = "stock" | "sector" | "region";

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
};

const formatPercent = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
};

const DIFF_THRESHOLD = 5;
const STOCK_TILT_LIMIT = 5;
const MIN_TILT_DELTA = 0.05;

const normalizeKey = (value?: string) => value?.trim().toLowerCase() || "other";
const friendlyLabel = (value?: string) => value?.trim() || "Other";

type GroupDetailRow = {
  label: string;
  userPct: number;
  benchmarkPct: number;
  delta: number;
};

function buildGroupRows(
  userGroups: GroupExposure[],
  benchmarkGroups: BenchmarkExposureRow[],
): GroupDetailRow[] {
  const rows = new Map<string, GroupDetailRow>();

  for (const entry of userGroups ?? []) {
    const key = normalizeKey(entry.label);
    if (!rows.has(key)) {
      rows.set(key, {
        label: friendlyLabel(entry.label),
        userPct: 0,
        benchmarkPct: 0,
        delta: 0,
      });
    }

    const current = rows.get(key)!;
    current.userPct = entry.weightPct ?? 0;
  }

  for (const row of benchmarkGroups ?? []) {
    const key = normalizeKey(row.group_key);
    if (!rows.has(key)) {
      rows.set(key, {
        label: friendlyLabel(row.group_key),
        userPct: 0,
        benchmarkPct: 0,
        delta: 0,
      });
    }

    const current = rows.get(key)!;
    current.benchmarkPct = row.weight_pct ?? 0;
  }

  for (const entry of rows.values()) {
    entry.delta = entry.userPct - entry.benchmarkPct;
  }

  return Array.from(rows.values()).sort(
    (a, b) =>
      Math.max(b.userPct, b.benchmarkPct) - Math.max(a.userPct, a.benchmarkPct),
  );
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
      has_benchmark_enabled: hasBenchmarkComparison,
      mix_name: mixName,
      positions_count: positionsCount,
    });

    setActiveTab(tabId);
  };

  const { data: stockRowsData, isLoading: loadingStocks, error: stockError } =
    useBenchmarkExposure(benchmarkSymbol, "stock");
  const { data: sectorRowsData, isLoading: loadingSectors, error: sectorError } =
    useBenchmarkExposure(benchmarkSymbol, "sector");
  const { data: regionRowsData, isLoading: loadingRegions, error: regionError } =
    useBenchmarkExposure(benchmarkSymbol, "region");

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

  const stockRows = useMemo(() => {
    const rows = buildGroupRows(userStockExposure, stockRowsData);
    return rows.filter((row) => Math.abs(row.delta) >= MIN_TILT_DELTA);
  }, [userStockExposure, stockRowsData]);

  const stockOverweights = useMemo(
    () =>
      stockRows
        .filter((row) => row.delta > 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, STOCK_TILT_LIMIT),
    [stockRows],
  );

  const stockUnderweights = useMemo(
    () =>
      stockRows
        .filter((row) => row.delta < 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, STOCK_TILT_LIMIT),
    [stockRows],
  );

  const sectorRows = useMemo(
    () => buildGroupRows(userSectorExposure, sectorRowsData),
    [userSectorExposure, sectorRowsData],
  );

  const regionRows = useMemo(
    () => buildGroupRows(userRegionExposure, regionRowsData),
    [userRegionExposure, regionRowsData],
  );

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (onBenchmarkChange) {
      onBenchmarkChange(event.target.value);
    }
  };

  const renderStockList = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <p className="text-base font-semibold text-neutral-900">
          Tilts vs {benchmarkLabel} by stock
        </p>
        {loadingStocks && <span>Loading…</span>}
      </div>
      {stockError && (
        <p className="text-[11px] text-rose-500">
          {stockError}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TiltColumn
          title="Overweights"
          rows={stockOverweights}
          emptyText={`No meaningful overweights vs ${benchmarkLabel}.`}
        />
        <TiltColumn
          title="Underweights"
          rows={stockUnderweights}
          emptyText={`No meaningful underweights vs ${benchmarkLabel}.`}
        />
      </div>
    </div>
  );

  const renderGroupList = (
    rows: GroupDetailRow[],
    loading: boolean,
    error: string | null,
    header: string,
    dimension: string,
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <p className="text-base font-semibold text-neutral-900">
          {header}
        </p>
        {loading && <span>Loading…</span>}
      </div>
      <p className="text-[11px] text-neutral-500">
        Your mix vs {benchmarkLabel} by {dimension}
      </p>
      {error && (
        <p className="text-[11px] text-rose-500">{error}</p>
      )}
      {!rows.length && !loading ? (
        <p className="text-xs text-neutral-500">
          No benchmark data available.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map(renderTiltRow)}
        </div>
      )}

    </div>
  );

  const renderTiltRow = (row: GroupDetailRow) => (
    <div
      key={row.label}
      className="rounded-2xl border border-neutral-100 bg-white/70 px-3 py-2 shadow-sm"
    >
      <ExposureComparisonRow
        label={row.label}
        yourPct={row.userPct}
        benchmarkPct={row.benchmarkPct}
        diffPct={row.delta}
      />
    </div>
  );

  type TiltColumnProps = {
    title: string;
    rows: GroupDetailRow[];
    emptyText: string;
  };

  const TiltColumn = ({ title, rows, emptyText }: TiltColumnProps) => (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
        {title}
      </p>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map(renderTiltRow)}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">{emptyText}</p>
      )}
    </div>
  );

  return (
    <section className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Benchmark comparison
          </p>
          <h3 className="text-base font-semibold text-neutral-900">
            {userLabel} vs {benchmark.label}
          </h3>
          <p className="text-sm text-neutral-700">
            {benchmark.description}
          </p>
        </div>

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
      </div>

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

      <div className="rounded-2xl border border-neutral-100 bg-white/90 p-4">
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
          {activeTab === "stock" && renderStockList()}
          {activeTab === "sector" &&
            renderGroupList(
              sectorRows,
              loadingSectors,
              sectorError,
              `Tilts vs ${benchmarkLabel} by sector`,
              "sector",
            )}
          {activeTab === "region" &&
            renderGroupList(
              regionRows,
              loadingRegions,
              regionError,
              `Tilts vs ${benchmarkLabel} by region`,
              "region",
            )}
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
                {item.deltaPct > 0 ? `+${item.deltaPct.toFixed(1)}%` : `${item.deltaPct.toFixed(1)}%`}
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
