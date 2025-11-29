// src/data/etfHoldings.ts

export type EtfHolding = {
  etf_symbol: string;
  holding_symbol: string;
  holding_name: string;
  weight_pct: number;
  country?: string | null;
  sector?: string | null;
  asset_class?: string | null;
};

// For now, this is intentionally empty.
// The production ETF look-through uses Supabase (`etf_holdings` table + RPC).
export const etfHoldings: EtfHolding[] = [];
