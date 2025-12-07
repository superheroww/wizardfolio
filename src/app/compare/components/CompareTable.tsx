"use client";

type CompareTableRow = {
  label: string;
  aValue: string | number;
  bValue: string | number;
};

type CompareTableProps = {
  sectionLabel: string;
  rows: CompareTableRow[];
};

export default function CompareTable({
  sectionLabel,
  rows,
}: CompareTableProps) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-neutral-900">{sectionLabel}</h4>

      <div className="mt-3 divide-y divide-neutral-100">
        {/* Sticky Header Row */}
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_70px_70px] gap-4 bg-white px-0 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
          <div></div>
          <div className="text-right">Mix A</div>
          <div className="text-right">Mix B</div>
        </div>

        {/* Data Rows */}
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[minmax(0,1fr)_70px_70px] gap-4 px-0 py-3 text-sm"
          >
            <div className="truncate text-neutral-900">{row.label}</div>
            <div className="text-right font-medium text-neutral-700">
              {row.aValue}
            </div>
            <div className="text-right font-medium text-neutral-700">
              {row.bValue}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
