import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VBAL vs XBAL: ETF Comparison | WizardFolio",
  description:
    "Compare VBAL and XBAL: two Canadian balanced ETFs with roughly 60/40 equity-bond splits. See their building blocks, providers, and how they slot into a portfolio with WizardFolio.",
};

export default function VbalVsXbalPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          VBAL vs XBAL: What’s the difference?
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          VBAL and XBAL are Canadian balanced ETFs built for moderate risk portfolios. Both blend Canadian and international equities with fixed income, while Vanguard and iShares bring slightly different ETF building blocks and fee structures.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-zinc-500"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">VBAL</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-zinc-900">XBAL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Equity / bond split</td>
                <td className="py-2 pr-4 text-sm">~60% equities, ~40% fixed income.</td>
                <td className="py-2 pr-4 text-sm">~60% equities, ~40% fixed income.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Provider</td>
                <td className="py-2 pr-4 text-sm">Vanguard.</td>
                <td className="py-2 pr-4 text-sm">iShares.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-zinc-500">Building blocks</td>
                <td className="py-2 pr-4 text-sm">Vanguard’s mix of global equities and Canadian bonds.</td>
                <td className="py-2 pr-4 text-sm">iShares equivalents including CDN bonds and global stock ETFs.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-zinc-500">Typical use</td>
                <td className="py-2 pr-4 text-sm">Core balanced exposure with a Vanguard flavour.</td>
                <td className="py-2 pr-4 text-sm">Balanced exposure that aligns with a mix of iShares funds.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use VBAL</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Many investors lean on VBAL when they want a balanced portfolio built on Vanguard ETFs, enjoying the automatic mix of equities and bonds.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">How investors often use XBAL</p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Some investors prefer XBAL because it mirrors VBAL’s risk profile but keeps their assets inside the iShares ecosystem.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/40 p-4 md:p-5 text-sm text-zinc-600 leading-relaxed">
        <p className="mb-2 text-sm font-medium text-zinc-900">Mix VBAL and XBAL and see your true exposure</p>
        <p className="mb-3 text-sm text-zinc-600 leading-relaxed">
          Use WizardFolio to combine VBAL, XBAL, and other ETFs so you can see the actual company-, sector-, and country-level exposures aligned with your balanced allocation.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/VBAL.TO"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View VBAL.TO holdings
          </a>
          <a
            href="/holdings/XBAL.TO"
            className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
          >
            View XBAL.TO holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
