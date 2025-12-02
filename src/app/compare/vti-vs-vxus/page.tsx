import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VTI vs VXUS: ETF Comparison | WizardFolio",
  description:
    "Compare VTI and VXUS to understand how U.S. total market exposure pairs with international ex-U.S. coverage. Then mix them and see the actual stock-level exposures in WizardFolio.",
};

export default function VtiVsVxusPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          VTI vs VXUS: What’s the difference?
        </h1>
        <p className="text-sm text-muted-foreground">
          VTI is the U.S. total stock market ETF, while VXUS covers the international markets outside the U.S. Together they form a classic global equity pairing, balancing domestic and overseas exposure.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-muted-foreground"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">VTI</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">VXUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Index / region</td>
                <td className="py-2 pr-4 text-sm">CRSP U.S. Total Market.</td>
                <td className="py-2 pr-4 text-sm">Global ex-U.S. total market (developed + emerging).</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Holdings coverage</td>
                <td className="py-2 pr-4 text-sm">Thousands of U.S. companies across market caps.</td>
                <td className="py-2 pr-4 text-sm">Thousands of companies outside the U.S. across developed and emerging markets.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Typical use</td>
                <td className="py-2 pr-4 text-sm">Core U.S. equity sleeve.</td>
                <td className="py-2 pr-4 text-sm">International sleeve to pair with U.S. holdings.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-muted-foreground">Portfolio pairing</td>
                <td className="py-2 pr-4 text-sm">Often blended with VXUS for global coverage.</td>
                <td className="py-2 pr-4 text-sm">Often paired with VTI to cover the full world.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VTI</p>
          <p className="text-sm text-muted-foreground">
            Many investors use VTI as the U.S. equity foundation because it covers large, mid, and small caps in one ETF.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VXUS</p>
          <p className="text-sm text-muted-foreground">
            Some investors use VXUS to gain international exposure, combining it with a U.S. ETF such as VTI to approach a market-weighted global portfolio.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4 text-sm">
        <p className="mb-2 text-sm font-medium text-zinc-900">Mix VTI and VXUS and see your true exposure</p>
        <p className="mb-3 text-sm text-muted-foreground">
          WizardFolio lets you blend VTI, VXUS, and other ETFs to reveal the real stock-, sector-, and country-level weights instead of guessing from each fund’s label.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/VTI"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View VTI holdings
          </a>
          <a
            href="/holdings/VXUS"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View VXUS holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
