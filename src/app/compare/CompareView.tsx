"use client";

import { useEffect, useMemo, useState } from "react";
import ExposureSummary from "@/components/ExposureSummary";
import MixLine from "@/components/MixLine";
import { aggregateByRegion, aggregateBySector } from "@/lib/exposureAggregations";
import type { ApiExposureRow } from "@/lib/exposureEngine";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
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
  scratch: "Scratch mix",
};

export default function CompareView({ mixA, mixB }: CompareViewProps) {
  const [activeTab, setActiveTab] = useState<CompareViewTab>("regions");
  const { capture } = usePostHogSafe();

  useEffect(() => {
    capture("compare_tab_viewed", {
      tab: activeTab,
      mixA: mixA.selection.label,
      mixB: mixB.selection.label,
    });
  }, [activeTab, capture, mixA.selection.label, mixB.selection.label]);

  const slots = useMemo(
    () => [
      { label: "A", data: mixA },
      { label: "B", data: mixB },
    ],
    [mixA, mixB],
  );

  const renderList = (
    exposures: ApiExposureRow[],
    listType: "region" | "sector",
  ) => {
    const slices =
      listType === "region"
        ? aggregateByRegion(exposures).map((slice) => ({
            label: slice.region,
            weightPct: slice.weightPct,
          }))
        : aggregateBySector(exposures).map((slice) => ({
            label: slice.sector,
            weightPct: slice.weightPct,
          }));

    if (!slices.length) {
      return (
        <p className="text-sm text-neutral-500">
          No {listType} data available for this mix.
        </p>
      );
    }

    return (
      <ul className="space-y-2 text-sm text-neutral-600">
        {slices.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between rounded-2xl bg-neutral-50/70 px-3 py-2"
          >
            <span className="font-medium text-neutral-900">{item.label}</span>
            <span className="tabular-nums text-neutral-700">
              {item.weightPct.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderContent = (slot: SlotExposure) => {
    if (slot.loading) {
      return (
        <p className="text-sm text-neutral-500">Loading exposures…</p>
      );
    }

    if (slot.error) {
      return (
        <p className="text-sm text-red-500">
          {slot.error}
        </p>
      );
    }

    if (!slot.exposures.length) {
      return (
        <p className="text-sm text-neutral-500">
          Add ETFs to view this section.
        </p>
      );
    }

    switch (activeTab) {
      case "regions":
        return renderList(slot.exposures, "region");
      case "sectors":
        return renderList(slot.exposures, "sector");
      case "holdings":
        return <ExposureSummary exposure={slot.exposures} showHeader={false} />;
      case "performance":
        return (
          <p className="text-sm text-neutral-500">
            Performance metrics are coming soon.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <section className="w-full rounded-3xl border border-neutral-200 bg-white/90 shadow-sm shadow-black/5">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-h-[48px] rounded-2xl px-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-neutral-900/5 text-neutral-900"
                  : "bg-white text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-full overflow-y-auto px-4 py-5" style={{ maxHeight: "70vh" }}>
        <div className="grid gap-4 md:grid-cols-2">
          {slots.map((slotEntry) => (
            <div
              key={slotEntry.label}
              className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-sm shadow-black/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-neutral-500">
                    Mix {slotEntry.label}
                  </p>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {slotEntry.data.selection.label}
                  </h3>
                  <MixLine positions={slotEntry.data.selection.positions} />
                  <p className="text-xs text-neutral-500">
                    {SOURCE_LABEL[slotEntry.data.selection.source]}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-600">
                  {slotEntry.label}
                </span>
              </div>

              <div className="mt-4 flex-1 space-y-3">
                {renderContent(slotEntry.data)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
