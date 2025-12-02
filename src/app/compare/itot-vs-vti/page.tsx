import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ITOT vs VTI: ETF Comparison | WizardFolio",
  description:
    "Compare ITOT and VTI, two broadly similar U.S. total market ETFs from different providers. Mix them and others to see the exact exposures in WizardFolio.",
};

export default function ItotVsVtiPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          ITOT vs VTI: What’s the difference?
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          ITOT and VTI both cover the entire U.S. equity market, but they come from different index families and issuers. Their differences are subtle but worth exploring.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-zinc-500"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">ITOT</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">VTI</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Index provider</td>
                <td className="py-2 pr-4 text-sm">S&P Dow Jones (S&P Total Market).</td>
                <td className="py-2 pr-4 text-sm">CRSP U.S. Total Market.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Issuer</td>
                <td className="py-2 pr-4 text-sm">iShares.</td>
                <td className="py-2 pr-4 text-sm">Vanguard.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Coverage</td>
                <td className="py-2 pr-4 text-sm">Large + mid + small U.S. caps.</td>
                <td className="py-2 pr-4 text-sm">Large + mid + small U.S. caps.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-zinc-500">Typical use</td>
                <td className="py-2 pr-4 text-sm">Choose when preferring iShares’ ecosystem.</td>
                <td className="py-2 pr-4 text-sm">Choose when preferring Vanguard’s lineup.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use ITOT</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Many investors pick ITOT when consolidating their iShares holdings and targeting the U.S. total market.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VTI</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Some investors keep VTI as the backbone of their U.S. equity allocation because of Vanguard’s reputation and structure.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/40 p-4 md:p-5 text-sm text-zinc-600 leading-relaxed">
        <p className="mb-2 text-sm font-medium text-zinc-900">Mix ITOT and VTI and see your true exposure</p>
        <p className="mb-3 text-sm text-zinc-600 leading-relaxed">
          Mix ITOT, VTI, and other ETFs inside WizardFolio to inspect all of the underlying companies, sectors, and regions that make up your allocation.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/ITOT"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View ITOT holdings
          </a>
          <a
            href="/holdings/VTI"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View VTI holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
