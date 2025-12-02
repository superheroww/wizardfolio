import type { MetadataRoute } from "next";

const baseUrl = "https://www.wizardfolio.com";
const now = new Date().toISOString();

const holdings = [
  "ZSP.TO",
  "XUU.TO",
  "SCHD",
  "VXUS",
  "SCHX",
  "VO",
  "VEE.TO",
  "VCN.TO",
  "VGRO.TO",
  "VBAL.TO",
  "VWO",
  "IJH",
  "IEMG",
  "SCHB",
  "IVV",
  "ITOT",
  "VEA",
  "VFV.TO",
  "XIC.TO",
  "BND",
  "VOO",
  "ZAG.TO",
  "VTI",
  "VIU.TO",
  "VCNS.TO",
  "SPY",
  "QQQ",
  "XTOT.TO",
  "VT",
  "VB",
  "XEF.TO",
  "XAW.TO",
  "XEC.TO",
  "VUN.TO",
  "HHIS.TO",
  "VEQT.TO",
  "XEQT.TO",
  "VDY.TO",
  "IJR",
] as const;

const comparisons = [
  "voo-vs-qqq",
  "xeqt-vs-veqt",
  "vgro-vs-xgro",
  "vbal-vs-xbal",
  "vti-vs-vxus",
  "vt-vs-voo",
  "schd-vs-voo",
  "vfv-vs-voo",
  "xaw-vs-vt",
  "itot-vs-vti",
  "spy-vs-qqq",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      priority: 1,
      changeFrequency: "weekly",
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      priority: 0.6,
      changeFrequency: "monthly",
    },
    ...holdings.map((symbol) => ({
      url: `${baseUrl}/holdings/${symbol}`,
      lastModified: now,
      priority: 0.7,
      changeFrequency: "weekly",
    })),
    ...comparisons.map((slug) => ({
      url: `${baseUrl}/compare/${slug}`,
      lastModified: now,
      priority: 0.6,
      changeFrequency: "monthly",
    })),
  ];

  return pages;
}
