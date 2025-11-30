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
    label: "QQQ (Nasdaq-100)",
    description: "Megacap U.S. tech/growth heavy index.",
    positions: [{ symbol: "QQQ", weightPct: 100 }],
  },
  {
    id: "voo",
    label: "VOO (S&P 500)",
    description: "Broad U.S. large cap exposure.",
    positions: [{ symbol: "VOO", weightPct: 100 }],
  },
  {
    id: "vt",
    label: "VT (Global stocks)",
    description: "Global equity exposure (world index).",
    positions: [{ symbol: "VT", weightPct: 100 }],
  },
  {
    id: "veqt",
    label: "VEQT.TO (All-equity portfolio)",
    description: "Vanguard all-equity portfolio ETF.",
    positions: [{ symbol: "VEQT.TO", weightPct: 100 }],
  },
  {
    id: "vgro",
    label: "VGRO.TO (Growth portfolio)",
    description: "Vanguard 80/20 growth portfolio.",
    positions: [{ symbol: "VGRO.TO", weightPct: 100 }],
  },
  {
    id: "xeqt",
    label: "XEQT.TO (All-equity portfolio)",
    description: "iShares all-equity portfolio ETF.",
    positions: [{ symbol: "XEQT.TO", weightPct: 100 }],
  },
];
