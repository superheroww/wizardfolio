import { UserPosition } from "@/lib/exposureEngine";

type RawPositionsParam = string | string[] | undefined | null;

function normalizePosition(value: unknown): UserPosition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const symbolValue = (value as { symbol?: unknown }).symbol;
  const weightValue = (value as { weightPct?: unknown }).weightPct;

  if (typeof symbolValue !== "string") {
    return null;
  }

  const trimmedSymbol = symbolValue.trim();
  if (!trimmedSymbol) {
    return null;
  }

  const weightPct = Number(weightValue);
  if (!Number.isFinite(weightPct) || weightPct <= 0) {
    return null;
  }

  return {
    symbol: trimmedSymbol.toUpperCase(),
    weightPct,
  };
}

export function normalizePositions(rawPositions: unknown[]): UserPosition[] {
  return rawPositions
    .map(normalizePosition)
    .filter((position): position is UserPosition => position !== null);
}

export function buildPositionsSearchParams(positions: UserPosition[]): string {
  const cleaned = normalizePositions(positions);
  if (!cleaned.length) {
    return "";
  }

  return new URLSearchParams({
    positions: JSON.stringify(cleaned),
  }).toString();
}

export function parsePositionsParam(raw: RawPositionsParam): UserPosition[] {
  if (!raw) {
    return [];
  }

  const candidate = Array.isArray(raw) ? raw[0] : raw;
  let lastError: Error | null = null;

  const tryParse = (
    value: string | null | undefined,
  ): UserPosition[] | null => {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return normalizePositions(parsed);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      return null;
    }
  };

  const directResult = tryParse(candidate);
  if (directResult !== null) {
    return directResult;
  }

  try {
    const decoded = decodeURIComponent(candidate ?? "");
    if (decoded && decoded !== candidate) {
      const decodedResult = tryParse(decoded);
      if (decodedResult !== null) {
        return decodedResult;
      }
    }
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  if (lastError) {
    console.error("Failed to parse positions query param:", lastError, candidate);
  }

  return [];
}
