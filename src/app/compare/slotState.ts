import type { UserPosition } from "@/lib/exposureEngine";
import type { CompareSelection, CompareSlotSource } from "./types";

const SCRATCH_READY_MIN = 99.5;
const SCRATCH_READY_MAX = 100.5;

const normalizeScratchPositions = (positions: UserPosition[]) =>
  positions.map((position) => ({
    ...position,
    symbol: position.symbol?.trim() ?? "",
  }));

export type CompareSlotState = {
  selection: CompareSelection | null;
  source: CompareSlotSource | null;
  positions: UserPosition[];
  allocationPercent: number;
  isReady: boolean;
};

export function getAllocationPercent(positions: UserPosition[]): number {
  const normalized = normalizeScratchPositions(positions);
  return normalized.reduce((sum, position) => {
    if (!position.symbol) {
      return sum;
    }
    return sum + (Number.isFinite(position.weightPct) ? position.weightPct : 0);
  }, 0);
}

export function isScratchReady(positions: UserPosition[]): boolean {
  const normalized = normalizeScratchPositions(positions);
  const total = normalized.reduce((sum, position) => {
    if (!position.symbol) {
      return sum;
    }
    return sum + (Number.isFinite(position.weightPct) ? position.weightPct : 0);
  }, 0);
  const hasInvalidRow = normalized.some(
    (position) => Number.isFinite(position.weightPct) && position.weightPct > 0 && !position.symbol,
  );

  return (
    !hasInvalidRow &&
    total > SCRATCH_READY_MIN &&
    total < SCRATCH_READY_MAX
  );
}

export function prepareScratchPositions(
  positions: UserPosition[],
): UserPosition[] {
  return positions.length
    ? positions
    : [{ symbol: "", weightPct: 0 }];
}

export function deriveSlotState(
  selection: CompareSelection | null,
): CompareSlotState {
  const source = selection?.source ?? null;
  const positions = selection?.positions ?? [];
  const allocationPercent =
    source === "scratch" ? getAllocationPercent(positions) : 100;
  const isReady =
    Boolean(selection) &&
    (source !== "scratch" || isScratchReady(positions));

  return {
    selection,
    source,
    positions,
    allocationPercent,
    isReady,
  };
}
