import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VGRO vs XGRO: ETF Comparison | WizardFolio",
  description:
    "Compare VGRO and XGRO: two Canadian growth-oriented, balanced ETFs with about an 80/20 equity-bond split. See how their building blocks differ and explore their holdings with WizardFolio.",
};

export default function VgroVsXgroPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold ">
          VGRO vs XGRO: What’s the difference?
        </h1>
        <p className="text-sm text-muted-foreground">
          VGRO and XGRO are Canadian growth-oriented, all-in-one ETFs that hold both equities and bonds with an approximate 80/20 split. Vanguard versus iShares provides slightly different underlying ETFs and fee structures.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-muted-foreground"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">VGRO</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">XGRO</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Equity / bond split</td>
                <td className="py-2 pr-4 text-sm">~80% equities, ~20% bonds.</td>
                <td className="py-2 pr-4 text-sm">~80% equities, ~20% bonds.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Provider</td>
                <td className="py-2 pr-4 text-sm">Vanguard’s ETF lineup.</td>
                <td className="py-2 pr-4 text-sm">iShares’ suite with similar exposures.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Underlying building blocks</td>
                <td className="py-2 pr-4 text-sm">Vanguard U.S., international, emerging market, and Canadian ETFs.</td>
                <td className="py-2 pr-4 text-sm">iShares equivalents for the same regions plus Canadian content.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-muted-foreground">Typical use</td>
                <td className="py-2 pr-4 text-sm">Core growth-allocation with minimal maintenance.</td>
                <td className="py-2 pr-4 text-sm">Growth-focused balanced exposure built from iShares ETFs.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium ">How investors often use VGRO</p>
          <p className="text-sm text-muted-foreground">
            Many investors use VGRO when they want a mostly equity portfolio with a little fixed income, leaning on Vanguard’s ETFs for global diversification without rebalancing.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium ">How investors often use XGRO</p>
          <p className="text-sm text-muted-foreground">
            Some investors pick XGRO for a similar growth tilt but prefer iShares’ lineup and how it combines with other iShares holdings they already own.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4 text-sm">
        <p className="mb-2 text-sm font-medium ">Mix VGRO and XGRO and see your true exposure</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Combine VGRO, XGRO, and other ETFs in WizardFolio to understand the exact sector, country, and stock exposures inside each bunded allocation.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/VGRO.TO"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View VGRO.TO holdings
          </a>
          <a
            href="/holdings/XGRO.TO"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View XGRO.TO holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
