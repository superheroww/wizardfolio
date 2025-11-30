import { UserPosition } from "@/lib/exposureEngine";

type RawPositionsParam = string | string[] | undefined | null;

/**
 * Normalize a single raw position.
 */
function normalizePosition(value: unknown): UserPosition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const symbolValue = (value as { symbol?: unknown }).symbol;
  const weightValue = (value as { weightPct?: unknown }).weightPct;

  const symbol = typeof symbolValue === "string" ? symbolValue.trim().toUpperCase() : "";
  const weightPct = Number(weightValue);

  // 🚨 NEW LOGIC:
  // If BOTH symbol and weight are empty → IGNORE row entirely
  const isEmptyRow =
    (symbol === "" || symbolValue === undefined) &&
    (!Number.isFinite(weightPct) || weightPct === 0);

  if (isEmptyRow) {
    return null;
  }

  // If symbol is empty → invalid row
  if (!symbol) {
    return null;
  }

  // If weight ≤ 0 → invalid row
  if (!Number.isFinite(weightPct) || weightPct <= 0) {
    return null;
  }

  return { symbol, weightPct };
}

/**
 * Normalize all positions.
 */
export function normalizePositions(rawPositions: unknown[]): UserPosition[] {
  return rawPositions
    .map(normalizePosition)
    .filter((position): position is UserPosition => position !== null);
}

/**
 * Build query params.
 */
export function buildPositionsSearchParams(positions: UserPosition[]): string {
  const cleaned = normalizePositions(positions);
  if (!cleaned.length) {
    return "";
  }

  return new URLSearchParams({
    positions: JSON.stringify(cleaned),
  }).toString();
}

/**
 * Parse positions from URL param.
 */
export function parsePositionsParam(raw: RawPositionsParam): UserPosition[] {
  if (!raw) {
    return [];
  }

  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (!candidate || typeof candidate !== "string") {
    return [];
  }

  let lastError: Error | null = null;

  const tryParse = (value: string | null | undefined): UserPosition[] | null => {
    if (!value) return null;

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      return normalizePositions(parsed);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      return null;
    }
  };

  // First attempt
  const directResult = tryParse(candidate);
  if (directResult !== null) return directResult;

  // Try decoding nested params
  const seen = new Set<string>([candidate]);
  let decoded = candidate;
  let iterations = 0;

  while (iterations < 3) {
    iterations++;
    let next: string;

    try {
      next = decodeURIComponent(decoded);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      break;
    }

    if (next === decoded || seen.has(next)) break;

    seen.add(next);
    decoded = next;

    const decodedResult = tryParse(decoded);
    if (decodedResult !== null) return decodedResult;
  }

  if (lastError) {
    console.error("Failed to parse positions query param:", lastError, candidate);
  }

  return [];
}