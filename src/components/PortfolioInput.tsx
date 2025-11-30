"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";
import { ETF_UNIVERSE } from "@/data/etfUniverse";

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

type SymbolSelectorProps = {
  value: string;
  onCommit: (symbol: string) => void;
};

const MAX_ASSETS = 5;

function SymbolSelector({ value, onCommit }: SymbolSelectorProps) {
  const [query, setQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filteredSymbols = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return ETF_UNIVERSE;
    }
    return ETF_UNIVERSE.filter((symbol) =>
      symbol.toLowerCase().includes(search)
    );
  }, [query]);

  const handleSelect = useCallback(
    (symbol: string) => {
      setQuery(symbol);
      setIsFocused(false);
      onCommit(symbol);
    },
    [onCommit]
  );

  const handleCommit = useCallback(() => {
    onCommit(query);
  }, [onCommit, query]);

  const dropdownVisible = isFocused;

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleCommit();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleCommit();
            event.currentTarget.blur();
          }
        }}
        placeholder="Search symbol"
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-base sm:text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {dropdownVisible && (
        <div className="absolute left-0 right-0 z-10 mt-1 max-h-40 overflow-auto rounded-lg border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(symbol)}
                className="w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {symbol}
              </button>
            ))
          ) : (
            <p className="px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              No matches found
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortfolioInput({
  positions,
  onChange,
  onAnalyze,
  analyzeLabel = "See my breakdown →",
}: PortfolioInputProps) {
  // 🚨 Ignore empty rows (symbol "" AND weight 0)
  const validRows = positions.filter(
    (p) => p.symbol.trim() !== "" && p.weightPct > 0
  );

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
      const next = positions.map((p, i) =>
        i === index ? { ...p, ...patch } : p
      );

      onChange(next);

      // AUTO-ADD NEW ROW LOGIC
      const row = next[index];
      const rowIsComplete =
        row.symbol.trim() !== "" && row.weightPct > 0;

      const lastRow = next[next.length - 1];
      const lastRowIsEmpty =
        lastRow.symbol.trim() === "" && lastRow.weightPct === 0;

      const canAdd = next.length < MAX_ASSETS;

      // If this row is complete AND the form has no empty row at the bottom → add one
      if (rowIsComplete && !lastRowIsEmpty && canAdd) {
        onChange([...next, { symbol: "", weightPct: 0 }]);
      }
    },
    [positions, onChange]
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
    [positions, updatePosition]
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
        i === index ? { ...position, weightPct: normalized } : position
      );
      const totalWeightAfter = nextPositions.reduce(
        (sum, position) => sum + (position.weightPct ?? 0),
        0
      );

      posthog.capture("change_weight", {
        total_weight_after: totalWeightAfter,
        positions_count: nextPositions.length,
      });
    },
    [positions]
  );

  const addRow = () => {
    if (!canAddMore) return;
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
    <section className="w-full rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <header className="mb-3">
        <h2 className="text-lg font-semibold">Your portfolio mix</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Add ETFs and their weights until you reach 100%.
        </p>
      </header>

      <div className="space-y-2">
        {positions.map((pos, index) => (
          <div
            key={index}
            className="flex w-full flex-nowrap items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/70"
          >
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Symbol
              </label>
              <SymbolSelector
                value={pos.symbol}
                onCommit={(symbol) => handleSymbolCommit(index, symbol)}
              />
            </div>
            <div className="flex flex-col gap-1 w-24 min-w-[80px]">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Weight %
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-base sm:text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={pos.weightPct === 0 ? "" : pos.weightPct}
                onChange={(e) =>
                  updatePosition(index, {
                    weightPct: Number(e.target.value || 0),
                  })
                }
                onBlur={(event) =>
                  handleWeightCommit(index, Number(event.currentTarget.value || 0))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleWeightCommit(
                      index,
                      Number(event.currentTarget.value || 0)
                    );
                    event.currentTarget.blur();
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-zinc-200 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
            disabled={!canAddMore}
            className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {canAddMore ? "+ Add asset" : `Max ${MAX_ASSETS} assets`}
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {analyzeLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
