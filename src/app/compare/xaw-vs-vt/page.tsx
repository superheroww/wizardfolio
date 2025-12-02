import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XAW vs VT: ETF Comparison | WizardFolio",
  description:
    "Compare XAW’s ex-Canada global coverage with VT’s total world ETF. Mix them and other ETFs to see the exact exposures behind the headlines with WizardFolio.",
};

export default function XawVsVtPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          XAW vs VT: What’s the difference?
        </h1>
        <p className="text-sm text-muted-foreground">
          XAW gives Canadians global equity exposure excluding domestic Canadian stocks, while VT covers the entire world including Canada. They differ mostly in whether Canada is included.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-muted-foreground"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">XAW</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">VT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Coverage scope</td>
                <td className="py-2 pr-4 text-sm">Global equities excluding Canada.</td>
                <td className="py-2 pr-4 text-sm">Global equities including Canada.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Typical Canadian pairing</td>
                <td className="py-2 pr-4 text-sm">Often paired with a Canadian small-cap ETF.</td>
                <td className="py-2 pr-4 text-sm">Used alone as a one-fund global equity sleeve.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Holdings exposure</td>
                <td className="py-2 pr-4 text-sm">Mostly U.S. and ex-U.S. developed & emerging.</td>
                <td className="py-2 pr-4 text-sm">Includes the same scope plus Canadian issuers.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-muted-foreground">Typical use</td>
                <td className="py-2 pr-4 text-sm">Use with a Canadian-focused ETF to complete coverage.</td>
                <td className="py-2 pr-4 text-sm">Use alone for total world equity exposure.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use XAW</p>
          <p className="text-sm text-muted-foreground">
            Many Canadian investors layer XAW with a domestic ETF to cover global markets while keeping Canadian exposure separate.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VT</p>
          <p className="text-sm text-muted-foreground">
            Some investors reach for VT when they want a single ETF that includes every region, including Canada.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4 text-sm">
        <p className="mb-2 text-sm font-medium text-zinc-900">Mix XAW and VT and see your true exposure</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Combine XAW, VT, and other ETFs inside WizardFolio to reveal the actual stock-, sector-, and country-level contributions from each fund.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/XAW.TO"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View XAW.TO holdings
          </a>
          <a
            href="/holdings/VT"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View VT holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
