"use client";

import { useEffect, useState } from "react";
import MixLine from "@/components/MixLine";
import {
  aggregateByRegion,
  aggregateBySector,
  aggregateHoldingsBySymbol,
} from "@/lib/exposureAggregations";
import type { ApiExposureRow } from "@/lib/exposureEngine";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import { getAnonId } from "@/lib/analytics/anonId";
import {
  CompareSelection,
  CompareSelectionSource,
} from "./types";

type CompareViewTab = "regions" | "sectors" | "holdings" | "performance";

const TABS: { id: CompareViewTab; label: string }[] = [
  { id: "regions", label: "Regions" },
  { id: "sectors", label: "Sectors" },
  { id: "holdings", label: "Holdings" },
  { id: "performance", label: "Performance" },
];

type SlotExposure = {
  selection: CompareSelection;
  exposures: ApiExposureRow[];
  loading: boolean;
  error: string | null;
};

type CompareViewProps = {
  mixA: SlotExposure;
  mixB: SlotExposure;
};

const SOURCE_LABEL: Record<CompareSelectionSource, string> = {
  saved: "Saved mix",
  benchmark: "Benchmark",
  template: "Template",
  scratch: "Custom mix",
};

const formatPercent = (value: number | undefined | null) => {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}%`;
};

export default function CompareView({ mixA, mixB }: CompareViewProps) {
  const [activeTab, setActiveTab] = useState<CompareViewTab>("regions");
  const { capture } = usePostHogSafe();
  const [showPerformanceUpsell, setShowPerformanceUpsell] = useState(false);
  const isPerformanceLocked = true; // For now, Performance is always locked

  useEffect(() => {
    capture("compare_tab_viewed", {
      tab: activeTab,
      mixA: mixA.selection.label,
      mixB: mixB.selection.label,
    });
  }, [activeTab, capture, mixA.selection.label, mixB.selection.label]);

  const handlePerformanceLockedClick = () => {
    const anonId = getAnonId();

    capture("compare_performance_locked_clicked", {
      location: "compare_view",
      feature_key: "compare_performance",
      mixA_label: mixA.selection.label,
      mixB_label: mixB.selection.label,
      mixA_source: mixA.selection.source,
      mixB_source: mixB.selection.source,
      anon_id: anonId,
    });

    void fetch("/api/feature-gates/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        featureKey: "compare_performance",
        source: "compare_view",
        anonId,
        mixA: {
          label: mixA.selection.label,
          source: mixA.selection.source,
        },
        mixB: {
          label: mixB.selection.label,
          source: mixB.selection.source,
        },
      }),
    }).catch(() => {
      // Best-effort only; ignore errors on the client
    });

    setShowPerformanceUpsell(true);
  };

  const handleTabClick = (tabId: CompareViewTab) => {
    if (tabId === "performance" && isPerformanceLocked) {
      handlePerformanceLockedClick();
      return;
    }

    setActiveTab(tabId);
    setShowPerformanceUpsell(false);
  };

  const isLoading = mixA.loading || mixB.loading;
  const hasError = Boolean(mixA.error || mixB.error);
  const hasAnyExposure =
    mixA.exposures.length > 0 || mixB.exposures.length > 0;

  const renderRegionsTable = () => {
    const aSlices = aggregateByRegion(mixA.exposures);
    const bSlices = aggregateByRegion(mixB.exposures);

    if (!aSlices.length && !bSlices.length) {
      return (
        <p className="mt-4 text-sm text-neutral-500">
          No region data available yet. Add ETFs to your mixes to see this view.
        </p>
      );
    }

    const regionSet = new Set<string>([
      ...aSlices.map((slice) => slice.region),
      ...bSlices.map((slice) => slice.region),
    ]);

    const regions = Array.from(regionSet);
    const getRegionScore = (region: string) => {
      const aWeight = aSlices.find((s) => s.region === region)?.weightPct ?? 0;
      const bWeight = bSlices.find((s) => s.region === region)?.weightPct ?? 0;
      return Math.max(aWeight, bWeight);
    };
    regions.sort((r1, r2) => getRegionScore(r2) - getRegionScore(r1));

    const aLookup = new Map(aSlices.map((slice) => [slice.region, slice.weightPct]));
    const bLookup = new Map(bSlices.map((slice) => [slice.region, slice.weightPct]));

    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50/80">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Region
              </th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mix A
              </th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mix B
              </th>
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => (
              <tr key={region} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-sm text-neutral-900">{region}</td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {formatPercent(aLookup.get(region))}
                </td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {formatPercent(bLookup.get(region))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSectorsTable = () => {
    const aSlices = aggregateBySector(mixA.exposures);
    const bSlices = aggregateBySector(mixB.exposures);

    if (!aSlices.length && !bSlices.length) {
      return (
        <p className="mt-4 text-sm text-neutral-500">
          No sector data available yet. Add ETFs to your mixes to see this view.
        </p>
      );
    }

    const sectorSet = new Set<string>([
      ...aSlices.map((slice) => slice.sector),
      ...bSlices.map((slice) => slice.sector),
    ]);

    const sectors = Array.from(sectorSet);
    const getSectorScore = (sector: string) => {
      const aWeight = aSlices.find((s) => s.sector === sector)?.weightPct ?? 0;
      const bWeight = bSlices.find((s) => s.sector === sector)?.weightPct ?? 0;
      return Math.max(aWeight, bWeight);
    };
    sectors.sort((s1, s2) => getSectorScore(s2) - getSectorScore(s1));

    const aLookup = new Map(aSlices.map((slice) => [slice.sector, slice.weightPct]));
    const bLookup = new Map(bSlices.map((slice) => [slice.sector, slice.weightPct]));

    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50/80">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Sector
              </th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mix A
              </th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mix B
              </th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((sector) => (
              <tr key={sector} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-sm text-neutral-900">{sector}</td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {formatPercent(aLookup.get(sector))}
                </td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {formatPercent(bLookup.get(sector))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderHoldingsTable = () => {
    const aHoldings = aggregateHoldingsBySymbol(mixA.exposures);
    const bHoldings = aggregateHoldingsBySymbol(mixB.exposures);

    if (!aHoldings.length && !bHoldings.length) {
      return (
        <p className="mt-4 text-sm text-neutral-500">
          No holdings data available yet. Add ETFs to your mixes to see this view.
        </p>
      );
    }

    const symbolSet = new Set<string>([
      ...aHoldings.map((holding) => holding.holding_symbol ?? ""),
      ...bHoldings.map((holding) => holding.holding_symbol ?? ""),
    ]);

    const symbols = Array.from(symbolSet).filter(Boolean);
    symbols.sort((s1, s2) => {
      const a1 =
        aHoldings.find((holding) => holding.holding_symbol === s1)
          ?.total_weight_pct ?? 0;
      const b1 =
        bHoldings.find((holding) => holding.holding_symbol === s1)
          ?.total_weight_pct ?? 0;
      const a2 =
        aHoldings.find((holding) => holding.holding_symbol === s2)
          ?.total_weight_pct ?? 0;
      const b2 =
        bHoldings.find((holding) => holding.holding_symbol === s2)
          ?.total_weight_pct ?? 0;
      return Math.max(b2, a2) - Math.max(b1, a1);
    });

    const trimmedSymbols = symbols.slice(0, 5);

    const aLookup = new Map(
      aHoldings.map((holding) => [
        holding.holding_symbol,
        holding.total_weight_pct,
      ]),
    );
    const bLookup = new Map(
      bHoldings.map((holding) => [
        holding.holding_symbol,
        holding.total_weight_pct,
      ]),
    );

    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50/80">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Holding
              </th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mix A
              </th>
              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Mix B
              </th>
            </tr>
          </thead>
          <tbody>
            {trimmedSymbols.map((symbol) => (
              <tr key={symbol} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-sm text-neutral-900">{symbol}</td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {formatPercent(aLookup.get(symbol))}
                </td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {formatPercent(bLookup.get(symbol))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPerformancePlaceholder = () => (
    <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-6 text-sm text-neutral-500">
      Performance metrics are coming soon. You'll be able to compare 1/3/5-year
      returns, volatility, and more once backtesting is available.
    </div>
  );

  const renderActiveTab = () => {
    if (isLoading) {
      return (
        <p className="mt-4 text-sm text-neutral-500">
          Loading exposures for your mixes...
        </p>
      );
    }

    if (hasError) {
      return (
        <div className="mt-4 space-y-1 text-sm text-red-600">
          {mixA.error && <p>Mix A: {mixA.error}</p>}
          {mixB.error && <p>Mix B: {mixB.error}</p>}
        </div>
      );
    }

    if (!hasAnyExposure) {
      return (
        <p className="mt-4 text-sm text-neutral-500">
          Add ETFs to both mixes to view this comparison.
        </p>
      );
    }

    switch (activeTab) {
      case "regions":
        return renderRegionsTable();
      case "sectors":
        return renderSectorsTable();
      case "holdings":
        return renderHoldingsTable();
      case "performance":
        return renderPerformancePlaceholder();
      default:
        return null;
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-start gap-2">
            <span className="mt-[2px] inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
              A
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-neutral-900">
                {mixA.selection.label}
              </p>
              <p className="text-xs text-neutral-500">
                <MixLine positions={mixA.selection.positions} />
              </p>
            </div>
          </div>

          <div className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400 sm:block">
            vs
          </div>

          <div className="flex items-start gap-2">
            <span className="mt-[2px] inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
              B
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-neutral-900">
                {mixB.selection.label}
              </p>
              <p className="text-xs text-neutral-500">
                <MixLine positions={mixB.selection.positions} />
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-4 flex gap-2 rounded-2xl bg-neutral-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 min-h-[40px] rounded-2xl px-3 text-xs font-semibold transition sm:min-h-[44px] sm:text-sm ${
              activeTab === tab.id
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1">
              {tab.label}
              {tab.id === "performance" && (
                <span className="ml-1 inline-flex items-center justify-center text-[10px]">
                  🔒
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {showPerformanceUpsell && (
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-3 text-xs text-neutral-600">
          <p className="font-medium text-neutral-800">
            Performance backtests are coming soon.
          </p>
          <p className="mt-1">
            We&rsquo;re tracking interest in this feature to help prioritize our
            roadmap. Your click just helped bump it up.
          </p>
        </div>
      )}

      {renderActiveTab()}
    </section>
  );
}
