import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPY vs QQQ: ETF Comparison | WizardFolio",
  description:
    "Compare SPY and QQQ to understand the difference between S&P 500 coverage and the Nasdaq-100. Mix them with other ETFs and see the real exposure in WizardFolio.",
};

export default function SpyVsQqqPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold ">
          SPY vs QQQ: What’s the difference?
        </h1>
        <p className="text-sm text-muted-foreground">
          SPY tracks the S&P 500 while QQQ tracks the Nasdaq-100. SPY is a straightforward broad U.S. exposure, whereas QQQ leans heavily into tech and growth stocks.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-muted-foreground"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">SPY</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">QQQ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Index</td>
                <td className="py-2 pr-4 text-sm">S&P 500.</td>
                <td className="py-2 pr-4 text-sm">Nasdaq-100.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Focus</td>
                <td className="py-2 pr-4 text-sm">Broad U.S. large-cap market exposure.</td>
                <td className="py-2 pr-4 text-sm">Tech and growth-heavy large-cap segment.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Holdings count</td>
                <td className="py-2 pr-4 text-sm">~500 positions.</td>
                <td className="py-2 pr-4 text-sm">~100 positions.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-muted-foreground">Typical use</td>
                <td className="py-2 pr-4 text-sm">Core U.S. exposure.</td>
                <td className="py-2 pr-4 text-sm">High-tech / growth complement to a broader U.S. sleeve.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium ">How investors often use SPY</p>
          <p className="text-sm text-muted-foreground">
            Many investors use SPY as a proxy for the U.S. market, especially when building diversified portfolios where SPY acts as the foundation.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium ">How investors often use QQQ</p>
          <p className="text-sm text-muted-foreground">
            Some investors add QQQ when they want more concentration in large-cap technology and growth leaders alongside broader exposure.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4 text-sm">
        <p className="mb-2 text-sm font-medium ">Mix SPY and QQQ and see your true exposure</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Use WizardFolio to blend SPY, QQQ, and other ETFs so you can inspect the actual weight of each company, sector, and region in your mix.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/SPY"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View SPY holdings
          </a>
          <a
            href="/holdings/QQQ"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View QQQ holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
