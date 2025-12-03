import type { UserPosition } from "@/lib/exposureEngine";

export type BenchmarkMix = {
  id: string;
  label: string;
  description: string;
  positions: UserPosition[];
};

export const BENCHMARK_MIXES: BenchmarkMix[] = [
  {
    id: "qqq",
    label: "Nasdaq-100 (QQQ)",
    description: "Megacap U.S. tech/growth heavy index.",
    positions: [{ symbol: "QQQ", weightPct: 100 }],
  },
  {
    id: "voo",
    label: "S&P 500 (VOO)",
    description: "Broad U.S. large cap exposure.",
    positions: [{ symbol: "VOO", weightPct: 100 }],
  },
  {
    id: "vt",
    label: "Global Stocks (VT)",
    description: "Global equity exposure (world index).",
    positions: [{ symbol: "VT", weightPct: 100 }],
  },
  {
    id: "veqt",
    label: "All-equity portfolio (VEQT.TO)",
    description: "Vanguard all-equity portfolio ETF.",
    positions: [{ symbol: "VEQT.TO", weightPct: 100 }],
  },
  {
    id: "vgro",
    label: "Growth portfolio (VGRO.TO)",
    description: "Vanguard 80/20 growth portfolio.",
    positions: [{ symbol: "VGRO.TO", weightPct: 100 }],
  },
  {
    id: "xeqt",
    label: "All-equity portfolio (XEQT.TO)",
    description: "iShares all-equity portfolio ETF.",
    positions: [{ symbol: "XEQT.TO", weightPct: 100 }],
  },
];
