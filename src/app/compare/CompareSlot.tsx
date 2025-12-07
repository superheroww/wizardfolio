"use client";

import MixLine from "@/components/MixLine";
import MixPositionsEditor from "@/components/MixPositionsEditor";
import type { UserPosition } from "@/lib/exposureEngine";
import type { CompareSlotId } from "./types";
import type { CompareSlotState } from "./slotState";
import { prepareScratchPositions } from "./slotState";

const SOURCE_LABEL: Record<NonNullable<CompareSlotState["source"]>, string> = {
  saved: "Saved mix",
  benchmark: "Benchmark",
  template: "Template",
  scratch: "Custom mix",
};

type CompareSlotProps = {
  slotId: CompareSlotId;
  slotState: CompareSlotState;
  onSlotClick: () => void;
  onChangeMixClick: () => void;
  onScratchPositionsChange: (positions: UserPosition[]) => void;
};

export default function CompareSlot({
  slotId,
  slotState,
  onSlotClick,
  onChangeMixClick,
  onScratchPositionsChange,
}: CompareSlotProps) {
  const { selection, source, allocationPercent, isReady } = slotState;
  const isScratch = source === "scratch";
  const handleButtonClick = selection ? onChangeMixClick : onSlotClick;
  const allocationLabel =
    allocationPercent >= 100
      ? "100% allocated"
      : `${Math.round(allocationPercent)}% allocated`;
  const sourceLabel = source ? SOURCE_LABEL[source] : null;

  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-neutral-200 bg-white/80 p-5 shadow-sm shadow-black/5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-neutral-500">
              Mix {slotId}
            </span>
            {isScratch ? (
              <h3 className="text-lg font-semibold text-neutral-900">
                Build your mix
              </h3>
            ) : selection ? (
              <h3 className="text-2xl font-semibold text-neutral-900">
                {selection.label}
              </h3>
            ) : (
              <h3 className="text-2xl font-semibold text-neutral-900">
                Empty slot
              </h3>
            )}
          </div>
          {isReady && (
            <span className="rounded-full border border-neutral-200 px-3 py-0.5 text-[11px] font-semibold text-neutral-600">
              Ready
            </span>
          )}
        </div>

        {isScratch ? (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">{allocationLabel}</p>
            <MixPositionsEditor
              positions={prepareScratchPositions(selection?.positions ?? [])}
              onChange={onScratchPositionsChange}
              disableAddWhenFull
            />
          </div>
        ) : selection ? (
          <>
            <p className="text-sm font-medium tracking-tight text-neutral-500">
              {selection.positions.length} ETF
              {selection.positions.length === 1 ? "" : "s"}
            </p>
            <MixLine positions={selection.positions} />
            {sourceLabel && (
              <p className="text-xs text-neutral-500">{sourceLabel}</p>
            )}
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
        className="mt-auto flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-300"
      >
        {selection ? "Change mix" : "Select a mix"}
      </button>
    </div>
  );
}
