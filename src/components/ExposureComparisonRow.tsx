"use client";

type ExposureComparisonRowProps = {
  label: string;
  yourPct: number;
  benchmarkPct: number;
  diffPct: number;
  className?: string;
};

const formatPercent = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1)}%`;
};

const formatSignedPercent = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const formatted = safeValue.toFixed(1);
  return safeValue >= 0 ? `+${formatted}%` : `${formatted}%`;
};

const deltaTextColor = (value: number) => {
  if (value > 0.049) {
    return "text-emerald-600";
  }
  if (value < -0.049) {
    return "text-rose-600";
  }
  return "text-[--color-text-muted]";
};

export default function ExposureComparisonRow({
  label,
  yourPct,
  benchmarkPct,
  diffPct,
  className,
}: ExposureComparisonRowProps) {
  const rowClasses = ["flex flex-col gap-1 min-w-0", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClasses}>
      <p className="text-sm font-semibold leading-tight text-[--color-foreground] truncate">
        {label}
      </p>
      <div className="inline-flex items-center gap-2 text-[11px] text-[--color-text-muted] whitespace-nowrap">
        <span>Your mix {formatPercent(yourPct)}</span>
        <span aria-hidden="true">·</span>
        <span>Benchmark {formatPercent(benchmarkPct)}</span>
        <span aria-hidden="true">·</span>
        <span className={`font-semibold ${deltaTextColor(diffPct)}`}>
          {formatSignedPercent(diffPct)}
        </span>
      </div>
    </div>
  );
}
