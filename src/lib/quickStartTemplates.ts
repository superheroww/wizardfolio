import type { UserPosition } from "@/lib/exposureEngine";

export type TemplateType = "template" | "custom";

export type Template = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  positions: UserPosition[];
  type: TemplateType;
  isDefaultTemplate: boolean;
};

export const QUICK_START_TEMPLATES: Template[] = [
  {
    id: "us_core_tech_boost",
    emoji: "🎯",
    name: "S&P 500 + Nasdaq (80/20)",
    description: "S&P 500 exposure paired with a modest allocation to the Nasdaq index.",
    positions: [
      { symbol: "VOO", weightPct: 80 },
      { symbol: "QQQ", weightPct: 20 },
    ],
    type: "template",
    isDefaultTemplate: true,
  },
  {
    id: "couch-potato",
    emoji: "🇨🇦",
    name: "Couch Potato",
    description: "Simple Canadian all-equity mix using XEQT + VCN.",
    positions: [
      { symbol: "XEQT.TO", weightPct: 80 },
      { symbol: "VCN.TO", weightPct: 20 }, // replaced ZAG.TO (bond ETF)
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "all_in_one_xeqt",
    emoji: "🔥",
    name: "All-in-one XEQT",
    description:
      "Simple global all-equity portfolio with XEQT only. Great as a clean benchmark.",
    positions: [{ symbol: "XEQT.TO", weightPct: 100 }],
    type: "template",
    isDefaultTemplate: true,
  },
  {
    id: "all_in_one_veqt",
    emoji: "🧭",
    name: "All-in-one VEQT",
    description:
      "Global all-equity one-ticket using VEQT only. Helpful to compare its regional tilt against others.",
    positions: [{ symbol: "VEQT.TO", weightPct: 100 }],
    type: "template",
    isDefaultTemplate: true,
  },
  {
    id: "us_two_fund_voo_vxus",
    emoji: "🇺🇸",
    name: "US 2-fund: VOO + VXUS",
    description:
      "S&P 500 plus international stocks in a simple 60/40 split.",
    positions: [
      { symbol: "VOO", weightPct: 60 },
      { symbol: "VXUS", weightPct: 40 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "all_in_one_voo",
    emoji: "⚖️",
    name: "Pure S&P 500 (VOO)",
    description:
      "100% S&P 500 exposure, useful as a simple US benchmark against more diversified mixes.",
    positions: [{ symbol: "VOO", weightPct: 100 }],
    type: "template",
    isDefaultTemplate: false,
  },

  // EXISTING TEMPLATES (unchanged)

  {
    id: "growth-focus",
    emoji: "🚀",
    name: "Growth Focus",
    description: "More tilted to growth stocks.",
    positions: [
      { symbol: "QQQ", weightPct: 60 },
      { symbol: "VUG", weightPct: 40 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "maple-growth-mix",
    emoji: "🍁",
    name: "Maple Growth Mix",
    description: "Simple 3-ETF blend: Canada, U.S., and global growth.",
    positions: [
      { symbol: "XEQT.TO", weightPct: 60 },
      { symbol: "VCN.TO", weightPct: 20 },
      { symbol: "VFV.TO", weightPct: 20 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "global-three-fund",
    emoji: "🌍",
    name: "Global Three-Fund",
    description: "Broad US and international equity exposure.",
    positions: [
      { symbol: "VTI", weightPct: 40 },
      { symbol: "VXUS", weightPct: 30 },
      { symbol: "VT", weightPct: 30 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "core-us-intl",
    emoji: "🏛️",
    name: "Core US & Intl",
    description: "Simple mix of US and international stocks.",
    positions: [
      { symbol: "VTI", weightPct: 60 },
      { symbol: "VXUS", weightPct: 40 },
    ],
    type: "template",
    isDefaultTemplate: true,
  },
  {
    id: "dividends-tilt",
    emoji: "💸",
    name: "Dividends Tilt",
    description: "Leans into dividend ETFs.",
    positions: [
      { symbol: "SCHD", weightPct: 40 },
      { symbol: "VDY.TO", weightPct: 30 },
      { symbol: "ZDV.TO", weightPct: 30 },
    ],
    type: "template",
    isDefaultTemplate: false,
  },
  {
    id: "build-your-own",
    emoji: "✏️",
    name: "Build Your Own Mix",
    description: "Start fresh and customize everything.",
    positions: [],
    type: "custom",
    isDefaultTemplate: false,
  },
];

export const TEMPLATE_BY_ID = new Map(
  QUICK_START_TEMPLATES.map((t) => [t.id, t]),
);
