import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VTI vs VXUS: ETF Comparison | WizardFolio",
  description:
    "Compare VTI and VXUS to understand how U.S. total market exposure pairs with international ex-U.S. coverage. Then mix them and see the actual stock-level exposures in WizardFolio.",
};

export default function VtiVsVxusPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold">
          VTI vs VXUS: What’s the difference?
        </h1>
        <p className="text-sm text-neutral-700">
          VTI is the U.S. total stock market ETF, while VXUS covers the international markets outside the U.S. Together they form a classic global equity pairing, balancing domestic and overseas exposure.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-neutral-500"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-neutral-500">VTI</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-neutral-500">VXUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Index / region</td>
                <td className="py-2 pr-4 text-sm">CRSP U.S. Total Market.</td>
                <td className="py-2 pr-4 text-sm">Global ex-U.S. total market (developed + emerging).</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Holdings coverage</td>
                <td className="py-2 pr-4 text-sm">Thousands of U.S. companies across market caps.</td>
                <td className="py-2 pr-4 text-sm">Thousands of companies outside the U.S. across developed and emerging markets.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Typical use</td>
                <td className="py-2 pr-4 text-sm">Core U.S. equity sleeve.</td>
                <td className="py-2 pr-4 text-sm">International sleeve to pair with U.S. holdings.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-neutral-500">Portfolio pairing</td>
                <td className="py-2 pr-4 text-sm">Often blended with VXUS for global coverage.</td>
                <td className="py-2 pr-4 text-sm">Often paired with VTI to cover the full world.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700 md:grid-cols-2">
        <div>
          <p className="text-base font-semibold text-neutral-900">How investors often use VTI</p>
          <p className="text-sm text-neutral-700">
            Many investors use VTI as the U.S. equity foundation because it covers large, mid, and small caps in one ETF.
          </p>
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-900">How investors often use VXUS</p>
          <p className="text-sm text-neutral-700">
            Some investors use VXUS to gain international exposure, combining it with a U.S. ETF such as VTI to approach a market-weighted global portfolio.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700">
        <p className="mb-2 text-base font-semibold text-neutral-900">Mix VTI and VXUS and see your true exposure</p>
        <p className="mb-3 text-sm text-neutral-700">
          WizardFolio lets you blend VTI, VXUS, and other ETFs to reveal the real stock-, sector-, and country-level weights instead of guessing from each fund’s label.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/VTI"
            className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            View VTI holdings
          </a>
          <a
            href="/holdings/VXUS"
            className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            View VXUS holdings
          </a>
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
