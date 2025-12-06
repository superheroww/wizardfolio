import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XAW vs VT: ETF Comparison | WizardFolio",
  description:
    "Compare XAW’s ex-Canada global coverage with VT’s total world ETF. Mix them and other ETFs to see the exact exposures behind the headlines with WizardFolio.",
};

export default function XawVsVtPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold">
          XAW vs VT: What’s the difference?
        </h1>
        <p className="text-sm text-neutral-700">
          XAW gives Canadians global equity exposure excluding domestic Canadian stocks, while VT covers the entire world including Canada. They differ mostly in whether Canada is included.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-neutral-500"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-neutral-500">XAW</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-neutral-500">VT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Coverage scope</td>
                <td className="py-2 pr-4 text-sm">Global equities excluding Canada.</td>
                <td className="py-2 pr-4 text-sm">Global equities including Canada.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Typical Canadian pairing</td>
                <td className="py-2 pr-4 text-sm">Often paired with a Canadian small-cap ETF.</td>
                <td className="py-2 pr-4 text-sm">Used alone as a one-fund global equity sleeve.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-neutral-500">Holdings exposure</td>
                <td className="py-2 pr-4 text-sm">Mostly U.S. and ex-U.S. developed & emerging.</td>
                <td className="py-2 pr-4 text-sm">Includes the same scope plus Canadian issuers.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-neutral-500">Typical use</td>
                <td className="py-2 pr-4 text-sm">Use with a Canadian-focused ETF to complete coverage.</td>
                <td className="py-2 pr-4 text-sm">Use alone for total world equity exposure.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700 md:grid-cols-2">
        <div>
          <p className="text-base font-semibold text-neutral-900">How investors often use XAW</p>
          <p className="text-sm text-neutral-700">
            Many Canadian investors layer XAW with a domestic ETF to cover global markets while keeping Canadian exposure separate.
          </p>
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-900">How investors often use VT</p>
          <p className="text-sm text-neutral-700">
            Some investors reach for VT when they want a single ETF that includes every region, including Canada.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700">
        <p className="mb-2 text-base font-semibold text-neutral-900">Mix XAW and VT and see your true exposure</p>
        <p className="mb-3 text-sm text-neutral-700">
          Combine XAW, VT, and other ETFs inside WizardFolio to reveal the actual stock-, sector-, and country-level contributions from each fund.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/XAW.TO"
            className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            View XAW.TO holdings
          </a>
          <a
            href="/holdings/VT"
            className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            View VT holdings
          </a>
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
