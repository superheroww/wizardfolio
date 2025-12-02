import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VOO vs QQQ: ETF Comparison | WizardFolio",
  description:
    "Compare VOO vs QQQ: index tracked, focus, and how investors typically use each ETF. Then mix them and see your true stock-level exposure with WizardFolio.",
};

export default function VooVsQqqPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          VOO vs QQQ: What’s the difference?
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          VOO and QQQ are two of the most popular U.S. ETFs. VOO tracks the S&P 500, while QQQ tracks the Nasdaq-100. One is a broad U.S. large-cap index, the other is more focused on tech and growth stocks.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-zinc-500"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">VOO</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">QQQ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Index</td>
                <td className="py-2 pr-4 text-sm">S&P 500</td>
                <td className="py-2 pr-4 text-sm">Nasdaq-100</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Focus</td>
                <td className="py-2 pr-4 text-sm">Broad U.S. large-cap stocks across many sectors.</td>
                <td className="py-2 pr-4 text-sm">Tech-heavy, growth-oriented large-cap companies.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Number of holdings</td>
                <td className="py-2 pr-4 text-sm">~500</td>
                <td className="py-2 pr-4 text-sm">~100</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-zinc-500">Typical use</td>
                <td className="py-2 pr-4 text-sm">Core U.S. equity exposure inside a diversified portfolio.</td>
                <td className="py-2 pr-4 text-sm">Tilt toward U.S. tech and growth on top of a broader core.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VOO</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Many investors use VOO as a simple way to hold the S&P 500: a broad mix of U.S. large-cap companies across sectors like technology, health care, financials, and industrials.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use QQQ</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Some investors use QQQ when they want more exposure to tech and growth. It is more concentrated in a smaller set of large-cap companies, especially technology-related sectors.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/40 p-4 md:p-5 text-sm text-zinc-600 leading-relaxed">
        <p className="mb-2 text-sm font-medium text-zinc-900">Mix VOO and QQQ and see your true exposure</p>
        <p className="mb-3 text-sm leading-relaxed">
          Instead of guessing how much tech or broad market exposure you&apos;re getting, you can mix VOO, QQQ, and other ETFs and see the actual stock-level breakdown by company, sector, and region.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/VOO"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View VOO holdings
          </a>
          <a
            href="/holdings/QQQ"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View QQQ holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
