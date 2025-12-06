import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VFV vs VOO: ETF Comparison | WizardFolio",
  description:
    "Compare VFV and VOO to see how the TSX-listed S&P 500 ETF stacks up against the U.S.-listed version. Mix them and other ETFs to understand true exposure with WizardFolio.",
};

export default function VfvVsVooPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">
          VFV vs VOO: What’s the difference?
        </h1>
        <p className="text-sm text-neutral-700">
          VFV is a Canadian-dollar, TSX-listed S&P 500 ETF whereas VOO is the classic NYSE-listed S&P 500 fund. Both track the same index, but listing location, currency, and fee structure differ.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-neutral-500"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-neutral-500">VFV</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-neutral-500">VOO</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Listing / currency</td>
                <td className="py-2 pr-4 text-sm">TSX, CAD.</td>
                <td className="py-2 pr-4 text-sm">NYSE, USD.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Index</td>
                <td className="py-2 pr-4 text-sm">S&P 500.</td>
                <td className="py-2 pr-4 text-sm">S&P 500.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">MER</td>
                <td className="py-2 pr-4 text-sm">Slightly higher due to CAD listing.</td>
                <td className="py-2 pr-4 text-sm">Slightly lower due to U.S. listing efficiencies.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-neutral-500">Typical use</td>
                <td className="py-2 pr-4 text-sm">Convenient for Canadian accounts without needing currency conversions.</td>
                <td className="py-2 pr-4 text-sm">Core U.S. sleeve for USD-based portfolios.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700 md:grid-cols-2">
        <div>
          <p className="text-base font-semibold text-neutral-900">How investors often use VFV</p>
          <p className="text-sm text-neutral-700">
            Many investors pick VFV when they want S&P 500 exposure inside a Canadian dollar account.
          </p>
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-900">How investors often use VOO</p>
          <p className="text-sm text-neutral-700">
            Some investors prefer VOO when they are already using USD or want the lowest possible MER for S&P 500 coverage.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700">
        <p className="mb-2 text-base font-semibold text-neutral-900">Mix VFV and VOO and see your true exposure</p>
        <p className="mb-3 text-sm text-neutral-700">
          WizardFolio can mix VFV, VOO, and other ETFs to expose the actual stock-, sector-, and region-level weights instead of relying solely on the ticker labels.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/VFV.TO"
            className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            View VFV.TO holdings
          </a>
          <a
            href="/holdings/VOO"
            className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            View VOO holdings
          </a>
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
