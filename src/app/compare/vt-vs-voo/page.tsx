import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VT vs VOO: ETF Comparison | WizardFolio",
  description:
    "Compare VT and VOO to understand the difference between a global total market ETF and the S&P 500. Mix them with other ETFs to see the full exposure in WizardFolio.",
};

export default function VtVsVooPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          VT vs VOO: What’s the difference?
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          VT is Vanguard’s total world stock ETF, while VOO tracks the S&P 500. VT spans nearly every region, while VOO focuses on large-cap U.S. companies, so they play different roles in a portfolio.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-zinc-500"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">VT</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">VOO</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Index scope</td>
                <td className="py-2 pr-4 text-sm">FTSE Global All Cap / worldwide.</td>
                <td className="py-2 pr-4 text-sm">S&P 500 (U.S. large-cap). </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Region diversification</td>
                <td className="py-2 pr-4 text-sm">U.S. + international, including emerging markets.</td>
                <td className="py-2 pr-4 text-sm">U.S. large caps only.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Typical use</td>
                <td className="py-2 pr-4 text-sm">One-stop global equity sleeve.</td>
                <td className="py-2 pr-4 text-sm">Core U.S. exposure inside a diversified mix.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-zinc-500">Pairing</td>
                <td className="py-2 pr-4 text-sm">Often paired with a bond ETF for full asset allocation.</td>
                <td className="py-2 pr-4 text-sm">Often combined with international ETFs for a global mix.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VT</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Many investors use VT as a single ETF that covers the entire global equity market.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VOO</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Some investors use VOO when they want a dedicated U.S. large-cap sleeve to complement international exposure elsewhere.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/40 p-4 md:p-5 text-sm text-zinc-600 leading-relaxed">
        <p className="mb-2 text-sm font-medium text-zinc-900">Mix VT and VOO and see your true exposure</p>
        <p className="mb-3 text-sm text-zinc-600 leading-relaxed">
          Mix VT, VOO, and other ETFs inside WizardFolio so you can inspect the underlying stocks, sectors, and regions instead of relying on broad labels.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/VT"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View VT holdings
          </a>
          <a
            href="/holdings/VOO"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View VOO holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
