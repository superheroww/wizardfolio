// src/data/etfHoldings.ts

// Shape expected by src/lib/exposureEngine.ts
export type EtfHolding = {
  // Symbol of the underlying holding (e.g., "AAPL")
  symbol: string;
  // Weight as a fraction (0–1) or percent; the engine only multiplies,
  // so we don't care about the exact scale for this stub.
  weight: number;
  // Optional extra metadata we might use in the future
  holding_name?: string;
  country?: string | null;
  sector?: string | null;
  asset_class?: string | null;
};

/**
 * Local lookup map for ETF holdings, keyed by ETF symbol.
 *
 * Expected shape in exposureEngine.ts:
 * {
 *   VOO: [{ symbol: "AAPL", weight: 0.06 }, { symbol: "MSFT", weight: 0.05 }],
 *   QQQ: [...],
 * }
 *
 * For the current MVP, this is intentionally empty because the
 * production look-through uses Supabase (`etf_holdings` table + RPC).
 */
export const etfHoldings: Record<string, EtfHolding[]> = {};