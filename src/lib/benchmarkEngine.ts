import { BENCHMARK_MIXES } from "@/lib/benchmarkPresets";
import type { BenchmarkMix } from "@/lib/benchmarkPresets";
import type { UserPosition } from "@/lib/exposureEngine";

const US_LARGE_CAP_SYMBOLS = new Set([
  "VOO",
  "SPY",
  "IVV",
  "SCHX",
  "SCHB",
  "VTI",
  "ITOT",
]);

const GLOBAL_ETF_SYMBOLS = new Set([
  "VT",
  "VXUS",
  "XAW",
  "XTOT",
  "XEQT.TO",
  "VEQT.TO",
]);

const TO_BENCHMARK_SYMBOL_MAP: Record<string, string> = {
  "VEQT.TO": "veqt",
  "VGRO.TO": "vgro",
  "XEQT.TO": "xeqt",
};

export type HoldingExposure = {
  symbol: string;
  weightPct: number;
};

export function normalizeSlice(exposures: HoldingExposure[]): HoldingExposure[] {
  const total = exposures.reduce(
    (sum, holding) => sum + (holding.weightPct ?? 0),
    0,
  );

  if (!total || total <= 0.000001) {
    return exposures;
  }

  return exposures.map((holding) => ({
    ...holding,
    weightPct: (holding.weightPct / total) * 100,
  }));
}

export type MixComparisonResult = {
  overlapPct: number;
  differencePct: number;
  coveragePct: number;
  visibleCount: number;
  overweights: {
    ticker: string;
    userPct: number;
    benchmarkPct: number;
    deltaPct: number;
  }[];
  underweights: {
    ticker: string;
    userPct: number;
    benchmarkPct: number;
    deltaPct: number;
  }[];
};

const round = (value: number) => Number(value.toFixed(2));

const MIN_DELTA = 0.5;

const isDisplayTicker = (symbol: string): boolean => {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return false;
  if (/^CA[0-9A-Z]{9,}$/.test(normalized)) return false;
  if (normalized.length > 8) return false;
  return true;
};

const findBenchmarkById = (id: string): BenchmarkMix =>
  BENCHMARK_MIXES.find((mix) => mix.id === id) ?? BENCHMARK_MIXES[0];

export const findBenchmarkBySymbol = (symbol: string): BenchmarkMix | undefined => {
  const normalized = symbol.trim().toUpperCase();
  return BENCHMARK_MIXES.find((mix) => {
    const mixSymbol = mix.positions?.[0]?.symbol?.trim().toUpperCase() ?? "";
    return mixSymbol === normalized || mix.id.toUpperCase() === normalized;
  });
};

const isValidPosition = (pos: UserPosition) =>
  typeof pos.symbol === "string" && pos.symbol.trim() !== "" && Number.isFinite(pos.weightPct);

export function pickDefaultBenchmark(userPositions: UserPosition[]): BenchmarkMix {
  if (!userPositions.length) {
    return BENCHMARK_MIXES[0];
  }

  const normalized = userPositions
    .filter(isValidPosition)
    .map((pos) => ({
      symbol: pos.symbol.trim().toUpperCase(),
      weightPct: Math.max(0, pos.weightPct),
    }));

  if (!normalized.length) {
    return BENCHMARK_MIXES[0];
  }

  const totalWeight = normalized.reduce(
    (sum, pos) => sum + pos.weightPct,
    0,
  );

  for (const pos of normalized) {
    if (pos.symbol in TO_BENCHMARK_SYMBOL_MAP) {
      return findBenchmarkById(TO_BENCHMARK_SYMBOL_MAP[pos.symbol]);
    }
  }

  if (totalWeight > 0) {
    const usWeight = normalized.reduce(
      (sum, pos) =>
        US_LARGE_CAP_SYMBOLS.has(pos.symbol) ? sum + pos.weightPct : sum,
      0,
    );

    if (usWeight / totalWeight >= 0.5) {
      return findBenchmarkById("voo");
    }

    const globalWeight = normalized.reduce(
      (sum, pos) =>
        GLOBAL_ETF_SYMBOLS.has(pos.symbol) ? sum + pos.weightPct : sum,
      0,
    );

    if (globalWeight / totalWeight >= 0.4) {
      return findBenchmarkById("vt");
    }
  }

  return findBenchmarkById("qqq");
}

export function getFallbackBenchmark(singleSymbol: string) {
  const normalized = singleSymbol.trim().toUpperCase();

  if (US_LARGE_CAP_SYMBOLS.has(normalized)) {
    return "VT";
  }

  if (GLOBAL_ETF_SYMBOLS.has(normalized)) {
    return "VOO";
  }

  return "VOO";
}


export function compareMixes(
  user: { ticker: string; weightPct: number }[],
  benchmark: { ticker: string; weightPct: number }[],
): MixComparisonResult {
  const normalizeEntry = (value: string) => value.trim().toUpperCase();

  const normalizedUserEntries: HoldingExposure[] = user
    .map((entry) => ({
      symbol: normalizeEntry(entry.ticker),
      weightPct: Math.max(0, entry.weightPct),
    }))
    .filter((entry) => entry.symbol && entry.weightPct > 0);

  const normalizedBenchmarkEntries: HoldingExposure[] = benchmark
    .map((entry) => ({
      symbol: normalizeEntry(entry.ticker),
      weightPct: Math.max(0, entry.weightPct),
    }))
    .filter((entry) => entry.symbol && entry.weightPct > 0);

  const userMap = new Map<string, number>();
  const benchmarkMap = new Map<string, number>();

  normalizedUserEntries.forEach((entry) => {
    const current = userMap.get(entry.symbol) ?? 0;
    userMap.set(entry.symbol, current + entry.weightPct);
  });

  normalizedBenchmarkEntries.forEach((entry) => {
    const current = benchmarkMap.get(entry.symbol) ?? 0;
    benchmarkMap.set(entry.symbol, current + entry.weightPct);
  });

  const allTickers = new Set<string>([
    ...userMap.keys(),
    ...benchmarkMap.keys(),
  ]);

  const sharedTickers: string[] = [];
  const userOnlyTickers: string[] = [];
  const benchmarkOnlyTickers: string[] = [];

  for (const ticker of allTickers) {
    const inUser = userMap.has(ticker);
    const inBenchmark = benchmarkMap.has(ticker);

    if (inUser && inBenchmark) {
      sharedTickers.push(ticker);
    } else if (inUser) {
      userOnlyTickers.push(ticker);
    } else {
      benchmarkOnlyTickers.push(ticker);
    }
  }

  type DiffRow = {
    ticker: string;
    userPct: number;
    benchmarkPct: number;
    deltaPct: number;
  };

  const diffs: DiffRow[] = sharedTickers.map((ticker) => {
    const userPct = userMap.get(ticker) ?? 0;
    const benchmarkPct = benchmarkMap.get(ticker) ?? 0;
    return {
      ticker,
      userPct,
      benchmarkPct,
      deltaPct: userPct - benchmarkPct,
    };
  });

  const overweights = diffs
    .filter((diff) => diff.deltaPct > 0)
    .filter((diff) => Math.abs(diff.deltaPct) >= MIN_DELTA)
    .filter((diff) => isDisplayTicker(diff.ticker))
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
    .slice(0, 4)
    .map((diff) => ({
      ticker: diff.ticker,
      userPct: round(diff.userPct),
      benchmarkPct: round(diff.benchmarkPct),
      deltaPct: round(diff.deltaPct),
    }));

  const underweights = diffs
    .filter((diff) => diff.deltaPct < 0)
    .filter((diff) => Math.abs(diff.deltaPct) >= MIN_DELTA)
    .filter((diff) => isDisplayTicker(diff.ticker))
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
    .slice(0, 4)
    .map((diff) => ({
      ticker: diff.ticker,
      userPct: round(diff.userPct),
      benchmarkPct: round(diff.benchmarkPct),
      deltaPct: round(diff.deltaPct),
    }));

  const benchmarkSliceRaw: HoldingExposure[] = normalizedBenchmarkEntries.map(
    (entry) => ({
      symbol: entry.symbol,
      weightPct: entry.weightPct,
    }),
  );

  const userSliceRaw: HoldingExposure[] = benchmarkSliceRaw.map((entry) => ({
    symbol: entry.symbol,
    weightPct: userMap.get(entry.symbol) ?? 0,
  }));

  const coverageRaw = benchmarkSliceRaw.reduce(
    (sum, holding) => sum + holding.weightPct,
    0,
  );

  const benchmarkSlice = normalizeSlice(benchmarkSliceRaw);
  const userSlice = normalizeSlice(userSliceRaw);

  const userNormMap: Record<string, number> = {};
  for (const holding of userSlice) {
    userNormMap[holding.symbol] =
      (userNormMap[holding.symbol] ?? 0) + (holding.weightPct ?? 0);
  }

  const overlapRaw = benchmarkSlice.reduce((sum, holding) => {
    const userWeight = userNormMap[holding.symbol] ?? 0;
    return sum + Math.min(holding.weightPct ?? 0, userWeight);
  }, 0);

  const overlapPct = round(overlapRaw);
  const differencePct = round(Math.max(0, 100 - overlapRaw));
  const coveragePct = round(coverageRaw);
  const visibleCount = benchmarkSliceRaw.length;

  // Sanity check: when user exposures match benchmark exposures exactly (e.g., VOO vs VOO),
  // coverage equals the visible slice sum (~60–70%) and overlap is ~100% while difference is ~0.
  return {
    overlapPct,
    differencePct,
    coveragePct,
    visibleCount,
    overweights,
    underweights,
  };
}
