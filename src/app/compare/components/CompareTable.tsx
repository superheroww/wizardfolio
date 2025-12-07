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
    <div>
      <div className="divide-y divide-neutral-100 border-y border-neutral-100">
        {/* Sticky Header Row */}
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1.6fr)_minmax(70px,0.7fr)_minmax(70px,0.7fr)] gap-3 bg-white px-0 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          <div></div>
          <div className="text-right">Mix A</div>
          <div className="text-right">Mix B</div>
        </div>

        {/* Data Rows */}
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
