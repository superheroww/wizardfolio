"use client";

import type { TiltRow } from "@/lib/benchmarkTilts";

type TiltSectionColumnProps = {
  title: string;
  items: TiltRow[];
  fallbackText: string;
};

function TiltSectionColumn({
  title,
  items,
  fallbackText,
}: TiltSectionColumnProps) {
  return (
    <div>
      <div className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-[0.7rem] text-zinc-500 dark:text-zinc-400">
          {fallbackText}
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((row) => (
            <li
              key={`${row.label}-${row.delta}`}
              className="flex items-center justify-between text-[0.8rem] font-semibold text-zinc-800 dark:text-zinc-100"
            >
              <span className="truncate">{row.label}</span>
              <span className="tabular-nums">{row.deltaFormatted}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type BenchmarkTiltSectionProps = {
  title: string;
  contextLabel: string;
  benchmarkLabel: string;
  overweights: TiltRow[];
  underweights: TiltRow[];
  isLoading?: boolean;
  error?: string | null;
};

export default function BenchmarkTiltSection({
  title,
  benchmarkLabel,
  contextLabel,
  overweights,
  underweights,
  isLoading,
  error,
}: BenchmarkTiltSectionProps) {
  return (
    <div className="mt-4 rounded-2xl border border-zinc-200/60 bg-zinc-50/60 p-3 text-xs sm:text-sm dark:border-zinc-800/70 dark:bg-zinc-900/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </span>
        {isLoading && (
          <span className="text-[0.65rem] text-zinc-500 dark:text-zinc-400">
            Loading…
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TiltSectionColumn
          title="Overweights"
          items={overweights}
          fallbackText={`No meaningful overweights vs ${benchmarkLabel} by ${contextLabel}.`}
        />
        <TiltSectionColumn
          title="Underweights"
          items={underweights}
          fallbackText={`No meaningful underweights vs ${benchmarkLabel} by ${contextLabel}.`}
        />
      </div>

      {error && (
        <p className="mt-2 text-[0.7rem] text-rose-500 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
