"use client";

import MixLine from "@/components/MixLine";
import type {
  CompareSelection,
  CompareSelectionSource,
  CompareSlotId,
} from "./types";

const SOURCE_LABEL: Record<CompareSelectionSource, string> = {
  mixes: "Saved mix",
  benchmarks: "Benchmark",
  templates: "Template",
  scratch: "Start from scratch",
};

type CompareSlotProps = {
  slotId: CompareSlotId;
  selection: CompareSelection | null;
  onRequestSelection: () => void;
  disabled?: boolean;
};

export default function CompareSlot({
  slotId,
  selection,
  onRequestSelection,
  disabled = false,
}: CompareSlotProps) {
  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-neutral-200 bg-white/80 p-5 shadow-sm shadow-black/5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-neutral-500">
            Mix {slotId}
          </span>
          {selection && (
            <span className="rounded-full border border-neutral-200 px-3 py-0.5 text-[11px] font-semibold text-neutral-600">
              {SOURCE_LABEL[selection.source]}
            </span>
          )}
        </div>

        {selection ? (
          <>
            <h3 className="text-2xl font-semibold text-neutral-900">
              {selection.label}
            </h3>
            <p className="text-sm font-medium tracking-tight text-neutral-500">
              {selection.positions.length} ETF
              {selection.positions.length === 1 ? "" : "s"}
            </p>
            <MixLine positions={selection.positions} />
          </>
        ) : (
          <p className="text-sm text-neutral-600">
            Select a mix from your saved list, a benchmark, templates, or start
            fresh to begin the comparison.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRequestSelection}
        disabled={disabled}
        className={`mt-auto flex w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition ${
          disabled
            ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-500"
            : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300"
        }`}
      >
        {selection ? "Change mix" : "Select a mix"}
      </button>
    </div>
  );
}
