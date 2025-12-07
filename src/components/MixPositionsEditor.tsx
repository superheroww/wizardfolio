"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import posthog from "posthog-js";
import EtfBottomSheetSelect from "@/components/EtfBottomSheetSelect";
import type { UserPosition } from "@/lib/exposureEngine";

type MixPositionsEditorProps = {
  positions: UserPosition[];
  onChange: (positions: UserPosition[]) => void;
  actionSlot?: ReactNode;
  maxAssets?: number;
  disableAddWhenFull?: boolean;
};

const DEFAULT_MAX_ASSETS = 5;
const TOTAL_WEIGHT_TOLERANCE = 0.0001;

export default function MixPositionsEditor({
  positions,
  onChange,
  actionSlot,
  maxAssets = DEFAULT_MAX_ASSETS,
  disableAddWhenFull = false,
}: MixPositionsEditorProps) {
  const canAddMore = positions.length < maxAssets;
  const lastWeightByRow = useRef<Record<number, number>>({});
  const currentTotalWeight = positions.reduce(
    (sum, position) =>
      sum + (Number.isFinite(position.weightPct) ? position.weightPct : 0),
    0,
  );
  const isFull =
    currentTotalWeight >= 100 - TOTAL_WEIGHT_TOLERANCE;

  useEffect(() => {
    positions.forEach((position, index) => {
      if (lastWeightByRow.current[index] === undefined) {
        lastWeightByRow.current[index] = position.weightPct ?? 0;
      }
    });

    Object.keys(lastWeightByRow.current).forEach((key) => {
      const index = Number(key);
      if (index >= positions.length) {
        delete lastWeightByRow.current[index];
      }
    });
  }, [positions]);

  const updatePosition = useCallback(
    (index: number, patch: Partial<UserPosition>) => {
      const patched = positions.map((position, i) =>
        i === index ? { ...position, ...patch } : position,
      );

      const row = patched[index];
      const rowIsComplete = row.symbol.trim() !== "" && row.weightPct > 0;

      const lastRow = patched[patched.length - 1];
      const lastRowIsEmpty =
        lastRow?.symbol.trim() === "" && (lastRow?.weightPct ?? 0) === 0;

      const totalWeight = patched.reduce(
        (sum, position) =>
          sum + (Number.isFinite(position.weightPct) ? position.weightPct : 0),
        0,
      );
      const canAutoAdd = patched.length < maxAssets;
      const withinCapacity =
        totalWeight <
        100 - TOTAL_WEIGHT_TOLERANCE;

      let nextPositions = patched;

      if (rowIsComplete && !lastRowIsEmpty && canAutoAdd && withinCapacity) {
        nextPositions = [...patched, { symbol: "", weightPct: 0 }];
      } else if (
        !withinCapacity &&
        lastRowIsEmpty &&
        patched.length > 1
      ) {
        nextPositions = patched.slice(0, -1);
      }

      onChange(nextPositions);
    },
    [positions, onChange, maxAssets],
  );

  const handleSymbolCommit = useCallback(
    (index: number, rawSymbol: string) => {
      const trimmed = rawSymbol.trim();
      const prevSymbol = positions[index]?.symbol ?? "";
      if (prevSymbol === trimmed) {
        return;
      }

      updatePosition(index, { symbol: trimmed });
      posthog.capture("edit_position_symbol", {
        symbol_length: trimmed.length,
        had_previous_symbol: !!prevSymbol.trim(),
      });
    },
    [positions, updatePosition],
  );

  const handleWeightCommit = useCallback(
    (index: number, rawValue: number) => {
      if (!Number.isFinite(rawValue)) {
        return;
      }

      const normalized = rawValue;
      const previousRecorded = lastWeightByRow.current[index];
      if (previousRecorded === normalized) {
        return;
      }

      lastWeightByRow.current[index] = normalized;

      const nextPositions = positions.map((position, i) =>
        i === index ? { ...position, weightPct: normalized } : position,
      );
      const totalWeightAfter = nextPositions.reduce(
        (sum, position) => sum + (position.weightPct ?? 0),
        0,
      );

      posthog.capture("change_weight", {
        total_weight_after: totalWeightAfter,
        positions_count: nextPositions.length,
      });
    },
    [positions],
  );

  const addRow = () => {
    if (!canAddMore || (disableAddWhenFull && isFull)) return;
    const next = [...positions, { symbol: "", weightPct: 0 }];
    onChange(next);
    posthog.capture("add_position", {
      positions_count_after: next.length,
      source: "manual",
    });
  };

  const removeRow = (index: number) => {
    const next = positions.filter((_, i) => i !== index);
    onChange(next);
    posthog.capture("remove_position", {
      positions_count_after: next.length,
    });
  };

  return (
    <div>
      <div className="space-y-2">
        {positions.map((pos, index) => (
          <div
            key={index}
            className="flex w-full flex-nowrap items-end gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3"
          >
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-medium text-neutral-500">
                Symbol
              </label>
              <EtfBottomSheetSelect
                value={pos.symbol.trim() ? pos.symbol : null}
                onChange={(symbol) => handleSymbolCommit(index, symbol)}
              />
            </div>
            <div className="flex min-w-[80px] w-24 flex-col gap-1">
              <label className="block text-xs font-medium text-neutral-500">
                Weight %
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-base text-neutral-900 outline-none ring-0 focus:border-neutral-400 sm:text-sm"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={pos.weightPct === 0 ? "" : pos.weightPct}
                onChange={(event) =>
                  updatePosition(index, {
                    weightPct: Number(event.target.value || 0),
                  })
                }
                onBlur={(event) =>
                  handleWeightCommit(
                    index,
                    Number(event.currentTarget.value || 0),
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleWeightCommit(
                      index,
                      Number(event.currentTarget.value || 0),
                    );
                    event.currentTarget.blur();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-neutral-200 text-sm text-neutral-500 hover:bg-neutral-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            disabled={!canAddMore || (disableAddWhenFull && isFull)}
            className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {canAddMore ? "+ Add asset" : `Max ${maxAssets} assets`}
          </button>
          {actionSlot}
        </div>
      </div>
    </div>
  );
}
