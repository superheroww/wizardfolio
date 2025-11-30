import { UserPosition } from "@/lib/exposureEngine";

const MAX_FULL_LIST_LENGTH = 70;
const JOINER = " · ";

function formatPercent(value?: number) {
  const raw = Number.isFinite(value ?? 0) ? (value ?? 0) : 0;
  const scaled = Math.round(raw * 10);
  const formattedValue = scaled / 10;
  const shouldShowDecimal = scaled % 10 !== 0;
  return `${shouldShowDecimal ? formattedValue.toFixed(1) : formattedValue.toFixed(0)}%`;
}

export function mixLineFromPositions(positions: UserPosition[]): string {
  if (!positions.length) {
    return "";
  }

  const weight = (pos: UserPosition) =>
    Number.isFinite(pos.weightPct) ? pos.weightPct : 0;

  const entries = [...positions]
    .sort((a, b) => weight(b) - weight(a))
    .map(
      (pos) => `${pos.symbol.trim()} ${formatPercent(pos.weightPct)}`
    );

  const prefix = "ETF Mix:";
  const fullLine = `${prefix} ${entries.join(JOINER)}`;

  if (entries.length <= 3) {
    return fullLine;
  }

  if (entries.length === 4 && fullLine.length <= MAX_FULL_LIST_LENGTH) {
    return fullLine;
  }

  const topThree = entries.slice(0, 3).join(JOINER);
  const remaining = entries.length - 3;
  return `${prefix} ${topThree}${JOINER}+${remaining}`;
}

type MixLineProps = {
  positions: UserPosition[];
};

export default function MixLine({ positions }: MixLineProps) {
  const mixLine = mixLineFromPositions(positions);
  if (!mixLine) {
    return null;
  }

  return (
    <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {mixLine}
    </p>
  );
}
