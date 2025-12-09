"use client";

import { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";
import EtfBottomSheetSelect from "@/components/EtfBottomSheetSelect";
import { Trash2 } from "lucide-react";

type UserPosition = {
  symbol: string;
  weightPct: number;
};

type PortfolioInputProps = {
  positions: UserPosition[];
  onChange: (positions: UserPosition[]) => void;
  onAnalyze: () => void; // parent will call the API
  analyzeLabel?: string;
};

const MAX_ASSETS = 5;

function isValidPosition(p: UserPosition) {
  return p.symbol.trim() !== "" && p.weightPct > 0;
}

export default function PortfolioInput({
  positions,
  onChange,
  onAnalyze,
  analyzeLabel = "See my breakdown →",
}: PortfolioInputProps) {
  // If there are no positions yet, show a single blank row in the UI
  const displayPositions: UserPosition[] =
    positions.length === 0 ? [{ symbol: "", weightPct: 0 }] : positions;

  const showDeleteButton = displayPositions.length > 1;

  // 🚨 Ignore empty rows (symbol "" AND weight 0)
  const validRows = positions.filter(isValidPosition);

  // SUM ONLY VALID ROWS
  const totalWeight = validRows.reduce((acc, p) => acc + p.weightPct, 0);

  // 🚨 STRICT 100% requirement (with tiny floating tolerance)
  const isTotalValid = Math.abs(totalWeight - 100) < 0.0001;

  // Must have symbol for each valid row
  const hasEmptySymbol = validRows.some((p) => !p.symbol.trim());

  // Button enable logic
  const canAnalyze = validRows.length > 0 && isTotalValid && !hasEmptySymbol;

  const canAddMore = positions.length < MAX_ASSETS;

  const lastWeightByRow = useRef<Record<number, number>>({});

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
      // Use real positions if we have them; otherwise treat the single
      // displayed row as the first real row.
      const base: UserPosition[] =
        positions.length === 0 ? [{ symbol: "", weightPct: 0 }] : positions;

      const next = base.map((p, i) =>
        i === index ? { ...p, ...patch } : p,
      );

      onChange(next);
    },
    [positions, onChange],
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

      const base: UserPosition[] =
        positions.length === 0 ? [{ symbol: "", weightPct: 0 }] : positions;

      const nextPositions = base.map((position, i) =>
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
    if (!canAddMore) return;

    const next =
      positions.length === 0
        ? [{ symbol: "", weightPct: 0 }]
        : [...positions, { symbol: "", weightPct: 0 }];

    onChange(next);
    posthog.capture("add_position", {
      positions_count_after: next.length,
      source: "manual",
    });
  };

  const removeRow = (index: number) => {
    const base: UserPosition[] =
      positions.length === 0 ? [{ symbol: "", weightPct: 0 }] : positions;

    const next = base.filter((_, i) => i !== index);

    // If we removed the only row and there were no real positions,
    // keep state as [] — the guard will render a blank row again.
    const final = positions.length === 0 ? [] : next;

    onChange(final);
    posthog.capture("remove_position", {
      positions_count_after: final.length,
    });
  };

  return (
    <section className="w-full rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
      <header className="mb-3 space-y-1">
        <h2 className="text-base font-semibold text-neutral-900">
          Build your own Mix
        </h2>
        <p className="text-sm text-neutral-700">
          Add ETFs until your mix adds up to 100%.
        </p>
      </header>

      <div className="space-y-2">
        {displayPositions.map((pos, index) => (
          <div
            key={index}
            className="flex w-full flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3"
          >
            {/* ETF ticker label */}
            <label className="block text-xs font-medium text-neutral-500">
              ETF ticker
            </label>

            {/* ETF selector + delete aligned */}
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <EtfBottomSheetSelect
                  value={pos.symbol.trim() ? pos.symbol : null}
                  onChange={(symbol) => handleSymbolCommit(index, symbol)}
                />
              </div>

              {/* Delete button (trash icon) – only when more than one row */}
              {showDeleteButton && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  aria-label="Remove this ETF"
                  className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200 transition"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Allocation */}
            <div className="flex min-w-[80px] flex-col gap-1 sm:w-24">
              <label className="block text-xs font-medium text-neutral-500">
                Allocation (%)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-base text-neutral-900 outline-none ring-0 focus:border-neutral-400 sm:text-sm"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={pos.weightPct === 0 ? "" : pos.weightPct}
                onChange={(e) => {
                  let num = parseFloat(e.target.value);
                  if (isNaN(num)) num = 0;
                  num = Math.round(Math.min(100, Math.max(0, num)));
                  updatePosition(index, { weightPct: num });
                }}
                onBlur={(event) => {
                  let num = parseFloat(event.currentTarget.value);
                  if (isNaN(num)) num = 0;
                  num = Math.round(Math.min(100, Math.max(0, num)));
                  handleWeightCommit(index, num);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    let num = parseFloat(event.currentTarget.value);
                    if (isNaN(num)) num = 0;
                    num = Math.round(Math.min(100, Math.max(0, num)));
                    handleWeightCommit(index, num);
                    event.currentTarget.blur();
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            disabled={!canAddMore}
            className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {canAddMore ? "+ Add ETF" : `Max ${MAX_ASSETS} ETFs`}
          </button>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {analyzeLabel}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-neutral-600">
        {totalWeight < 100
          ? `You still have ${Math.max(0, 100 - totalWeight)}% remaining.`
          : "Your mix is ready."}
      </p>
    </section>
  );
}