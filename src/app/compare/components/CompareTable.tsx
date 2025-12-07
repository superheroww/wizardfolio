"use client";

type CompareTableRow = {
  label: string;
  aValue: string | number;
  bValue: string | number;
};

type CompareTableProps = {
  rows: CompareTableRow[];
};

export default function CompareTable({
  rows,
}: CompareTableProps) {
  return (
    <div className="border-y border-neutral-100">
      {/* Sticky Header Row */}
      <div className="sticky top-[3.75rem] sm:top-[4rem] z-10 bg-white/95 backdrop-blur-sm px-0">
        <div className="relative grid grid-cols-[minmax(0,1.6fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)] gap-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          <div></div>
          <div className="text-right">Mix A</div>
          <div className="text-right">Mix B</div>
          {/* Underline that stays with the header */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-neutral-200" />
        </div>
      </div>

      {/* Data Rows */}
      <div className="divide-y divide-neutral-100">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[minmax(0,1.6fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)] gap-3 px-0 py-2.5 text-sm"
            title={typeof row.label === 'string' ? row.label : undefined}
          >
            <div className="truncate text-neutral-900">{row.label}</div>
            <div className="text-right font-medium text-neutral-700">
              {row.aValue || '–'}
            </div>
            <div className="text-right font-medium text-neutral-700">
              {row.bValue || '–'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
