"use client";

import MixPositionsEditor from "@/components/MixPositionsEditor";
import type { UserPosition } from "@/lib/exposureEngine";

type PortfolioInputProps = {
  positions: UserPosition[];
  onChange: (positions: UserPosition[]) => void;
  onAnalyze: () => void; // parent will call the API
  analyzeLabel?: string;
};

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

  return (
    <section className="w-full rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
      <header className="mb-3">
        <h2 className="text-base font-semibold text-neutral-900">
          Your portfolio mix
        </h2>
        <p className="text-sm text-neutral-700">
          Add ETFs and their weights until you reach 100%.
        </p>
      </header>

      <MixPositionsEditor
        positions={positions}
        onChange={onChange}
        actionSlot={
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {analyzeLabel}
          </button>
        }
      />
    </section>
  );
}
