 "use client";

import { UserPosition } from "@/lib/exposureEngine";
import { ETF_UNIVERSE } from "@/data/etfUniverse";
import { useCallback, useEffect, useMemo, useState } from "react";

type PortfolioInputProps = {
  positions: UserPosition[];
  onChange: (positions: UserPosition[]) => void;
  onAnalyze: () => void;
};

type SymbolSelectorProps = {
  value: string;
  onSelect: (symbol: string) => void;
};

function SymbolSelector({ value, onSelect }: SymbolSelectorProps) {
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
      onSelect(symbol);
    },
    [onSelect]
  );

  const dropdownVisible = isFocused;

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search symbol"
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
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
}: PortfolioInputProps) {
  const totalWeight = positions.reduce((acc, p) => acc + (p.weightPct || 0), 0);
  const isTotalValid = totalWeight > 99.9 && totalWeight < 100.1;
  const hasEmptySymbol = positions.some((p) => !p.symbol.trim());
  const canAnalyze = positions.length > 0 && isTotalValid && !hasEmptySymbol;

  const updatePosition = useCallback(
    (index: number, patch: Partial<UserPosition>) => {
      const next = positions.map((p, i) =>
        i === index ? { ...p, ...patch } : p
      );
      onChange(next);
    },
    [positions, onChange]
  );

  const addRow = () => {
    onChange([...positions, { symbol: "", weightPct: 0 }]);
  };

  const removeRow = (index: number) => {
    const next = positions.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <section className="w-full rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <header className="mb-3">
        <h2 className="text-lg font-semibold">Your portfolio mix</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter each asset and its percentage. Aim for a total of 100%.
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
                onSelect={(symbol) => updatePosition(index, { symbol })}
              />
            </div>
            <div className="flex flex-col gap-1 w-24 min-w-[80px]">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Weight %
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none ring-0 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
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
        <div className="text-sm">
          <span className="font-medium">Total:</span>{" "}
          <span
            className={
              isTotalValid
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            {totalWeight.toFixed(1)}%
          </span>
          {!isTotalValid && (
            <span className="ml-1 text-xs text-rose-500 dark:text-rose-400">
              (should be ~100%)
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            + Add asset
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Analyze portfolio
          </button>
        </div>
      </div>
    </section>
  );
}
