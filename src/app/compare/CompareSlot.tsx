"use client";

import MixLine from "@/components/MixLine";
import MixPositionsEditor from "@/components/MixPositionsEditor";
import type { UserPosition } from "@/lib/exposureEngine";
import type {
  CompareSelection,
  CompareSelectionSource,
  CompareSlotId,
} from "./types";

const SOURCE_LABEL: Record<CompareSelectionSource, string> = {
  mixes: "Saved mix",
  benchmarks: "Benchmark",
  templates: "Template",
  scratch: "Custom mix",
};

type CompareSlotProps = {
  slotId: CompareSlotId;
  selection: CompareSelection | null;
  onSlotClick: () => void;
  onChangeMixClick: () => void;
  disabled?: boolean;
  isEditingScratch: boolean;
  scratchPositions?: UserPosition[];
  onScratchPositionsChange: (positions: UserPosition[]) => void;
  onScratchEditingDone: () => void;
};

export default function CompareSlot({
  slotId,
  selection,
  onSlotClick,
  onChangeMixClick,
  disabled = false,
  isEditingScratch,
  scratchPositions,
  onScratchPositionsChange,
  onScratchEditingDone,
}: CompareSlotProps) {
  const isScratch = selection?.source === "scratch";
  const showEditor = Boolean(isScratch && isEditingScratch);
  const editorPositions =
    scratchPositions && scratchPositions.length
      ? scratchPositions
      : selection?.positions ?? [{ symbol: "", weightPct: 0 }];
  const handleButtonClick = selection ? onChangeMixClick : onSlotClick;

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

        {showEditor ? (
          <div className="mt-2 space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900">
              Build your mix
            </h3>
            <MixPositionsEditor
              positions={editorPositions}
              onChange={onScratchPositionsChange}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onScratchEditingDone}
                className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Done
              </button>
            </div>
          </div>
        ) : selection ? (
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
        onClick={handleButtonClick}
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
