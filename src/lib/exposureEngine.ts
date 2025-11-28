import { etfHoldings } from "@/data/etfHoldings";

export type UserPosition = {
  symbol: string;
  weightPct: number;
};

export type ExposureBreakdown = {
  symbol: string;
  weightPct: number;
};

export function computeExposure(positions: UserPosition[]): ExposureBreakdown[] {
  const exposureMap = new Map<string, number>();

  for (const pos of positions) {
    const rawSymbol = pos.symbol.trim();
    if (!rawSymbol) continue;

    const symbol = rawSymbol.toUpperCase();
    const positionWeight = pos.weightPct;

    const etf = etfHoldings[symbol];

    if (etf && etf.length > 0) {
      for (const holding of etf) {
        const underlyingWeight = positionWeight * holding.weight;
        const current = exposureMap.get(holding.symbol) ?? 0;
        exposureMap.set(holding.symbol, current + underlyingWeight);
      }
    } else {
      const current = exposureMap.get(symbol) ?? 0;
      exposureMap.set(symbol, current + positionWeight);
    }
  }

  const result: ExposureBreakdown[] = Array.from(exposureMap.entries()).map(
    ([symbol, weight]) => ({
      symbol,
      weightPct: Number(weight.toFixed(2).replace(/\.0$/, "")),
    })
  );

  result.sort((a, b) => b.weightPct - a.weightPct);

  return result;
}
