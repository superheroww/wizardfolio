"use client";

import { useEffect, useState } from "react";
import MixLine from "@/components/MixLine";
import CompareTable from "./components/CompareTable";
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

const NORMALIZATION_NOTE =
  "Based on the largest holdings we have for each ETF, normalized to 100% for this comparison. Smaller positions in the fund may not be included in this view.";

function NormalizationCaption() {
  return (
    <p className="mt-2 text-[11px] leading-snug text-neutral-400">
      {NORMALIZATION_NOTE}
    </p>
  );
}

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
    const aLookup = new Map(
      aSlices.map((slice) => [
        slice.region,
        slice.normalizedWeightPct ?? slice.weightPct,
      ]),
    );
    const bLookup = new Map(
      bSlices.map((slice) => [
        slice.region,
        slice.normalizedWeightPct ?? slice.weightPct,
      ]),
    );

    const getRegionScore = (region: string) => {
      const aWeight = aLookup.get(region) ?? 0;
      const bWeight = bLookup.get(region) ?? 0;
      return Math.max(aWeight, bWeight);
    };
    regions.sort((r1, r2) => getRegionScore(r2) - getRegionScore(r1));

    const rows = regions.map((region) => ({
      label: region,
      aValue: formatPercent(aLookup.get(region)),
      bValue: formatPercent(bLookup.get(region)),
    }));

    return (
      <>
        <CompareTable sectionLabel="Regions" rows={rows} />
        <NormalizationCaption />
      </>
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
    const aLookup = new Map(
      aSlices.map((slice) => [
        slice.sector,
        slice.normalizedWeightPct ?? slice.weightPct,
      ]),
    );
    const bLookup = new Map(
      bSlices.map((slice) => [
        slice.sector,
        slice.normalizedWeightPct ?? slice.weightPct,
      ]),
    );

    const getSectorScore = (sector: string) => {
      const aWeight = aLookup.get(sector) ?? 0;
      const bWeight = bLookup.get(sector) ?? 0;
      return Math.max(aWeight, bWeight);
    };
    sectors.sort((s1, s2) => getSectorScore(s2) - getSectorScore(s1));

    const rows = sectors.map((sector) => ({
      label: sector,
      aValue: formatPercent(aLookup.get(sector)),
      bValue: formatPercent(bLookup.get(sector)),
    }));

    return (
      <>
        <CompareTable sectionLabel="Sectors" rows={rows} />
        <NormalizationCaption />
      </>
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
    const aLookup = new Map(
      aHoldings.map((holding) => [
        holding.holding_symbol,
        holding.normalized_total_weight_pct ?? holding.total_weight_pct ?? 0,
      ]),
    );
    const bLookup = new Map(
      bHoldings.map((holding) => [
        holding.holding_symbol,
        holding.normalized_total_weight_pct ?? holding.total_weight_pct ?? 0,
      ]),
    );

    const getHoldingScore = (symbol: string) => {
      const aWeight = aLookup.get(symbol) ?? 0;
      const bWeight = bLookup.get(symbol) ?? 0;
      return Math.max(aWeight, bWeight);
    };

    symbols.sort((s1, s2) => getHoldingScore(s2) - getHoldingScore(s1));

    const trimmedSymbols = symbols.slice(0, 5);

    const rows = trimmedSymbols.map((symbol) => ({
      label: symbol,
      aValue: formatPercent(aLookup.get(symbol)),
      bValue: formatPercent(bLookup.get(symbol)),
    }));

    return (
      <>
        <CompareTable sectionLabel="Holdings" rows={rows} />
        <NormalizationCaption />
      </>
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
