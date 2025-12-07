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

function getSortedPositions(positions: UserPosition[]) {
  const weight = (pos: UserPosition) =>
    Number.isFinite(pos.weightPct) ? pos.weightPct : 0;

  return [...positions]
    .filter((pos) => pos.symbol.trim() && weight(pos) > 0)
    .sort((a, b) => weight(b) - weight(a));
}

function normalizeEntries(positions: UserPosition[]) {
  return getSortedPositions(positions).map(
    (pos) => `${pos.symbol.trim()} ${formatPercent(pos.weightPct)}`
  );
}

export function mixLineFromPositions(positions: UserPosition[]): string {
  if (!positions.length) {
    return "";
  }

  const entries = normalizeEntries(positions);
  if (!entries.length) {
    return "";
  }

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

export function formatMixSummary(positions: UserPosition[]): string {
  const entries = normalizeEntries(positions);
  return entries.join(JOINER);
}

export function formatShareCardSubtitle(positions: UserPosition[]): string {
  const entries = normalizeEntries(positions);
  if (!entries.length) {
    return "Add ETFs to build your mix";
  }

  const detailedLine = entries.join(" + ");
  if (
    entries.length <= 2 ||
    (entries.length === 3 && detailedLine.length <= 48)
  ) {
    return detailedLine;
  }

  const sortedSymbols = getSortedPositions(positions).map((pos) =>
    pos.symbol.trim().toUpperCase(),
  );

  const preview = sortedSymbols.slice(0, 3).join(" + ");
  return `${preview} (${sortedSymbols.length} ETFs)`;
}

export function getSortedMixPositions(
  positions: UserPosition[],
): UserPosition[] {
  return getSortedPositions(positions);
}

export function formatShareCardTickers(positions: UserPosition[]): string {
  const sorted = getSortedPositions(positions).map((pos) =>
    pos.symbol.trim().toUpperCase(),
  );
  if (!sorted.length) {
    return "Add ETFs to build your mix";
  }

  const joined = sorted.join(" + ");
  if (sorted.length <= 3 && joined.length <= 36) {
    return joined;
  }

  const preview = sorted.slice(0, 3).join(" + ");
  return `${preview} (${sorted.length} ETFs)`;
}
