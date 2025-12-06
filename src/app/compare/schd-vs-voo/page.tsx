import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SCHD vs VOO: ETF Comparison | WizardFolio",
  description:
    "Compare SCHD’s dividend-focused U.S. holdings with VOO’s broad S&P 500 coverage. Use WizardFolio to mix, explore holdings, and understand true exposure.",
};

export default function SchdVsVooPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold ">
          SCHD vs VOO: What’s the difference?
        </h1>
        <p className="text-sm text-muted-foreground">
          SCHD selects dividend-paying U.S. companies with a quality screen, while VOO is a broad S&P 500 fund. Both are U.S.-focused but they lean toward different styles.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-muted-foreground"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">SCHD</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">VOO</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Focus</td>
                <td className="py-2 pr-4 text-sm">Dividend-paying U.S. large caps with quality filters.</td>
                <td className="py-2 pr-4 text-sm">Broad S&P 500 exposure.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Sector tilt</td>
                <td className="py-2 pr-4 text-sm">Some overweight in financials, industrials, and consumer staples.</td>
                <td className="py-2 pr-4 text-sm">Tracks the market-weighted S&P 500 sectors.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Typical use</td>
                <td className="py-2 pr-4 text-sm">Income-leaning U.S. exposure.</td>
                <td className="py-2 pr-4 text-sm">Core U.S. equity exposure.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-muted-foreground">Holdings breadth</td>
                <td className="py-2 pr-4 text-sm">Diversified but narrower than the S&P 500.</td>
                <td className="py-2 pr-4 text-sm">~500 S&P 500 companies.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium ">How investors often use SCHD</p>
          <p className="text-sm text-muted-foreground">
            Many investors pair SCHD with broader U.S. exposure when they want a dividend tilt plus quality screens.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium ">How investors often use VOO</p>
          <p className="text-sm text-muted-foreground">
            Some investors use VOO as their go-to core S&P 500 sleeve and then layer other ETFs for tilts or diversifications.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4 text-sm">
        <p className="mb-2 text-sm font-medium ">Mix SCHD and VOO and see your true exposure</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Combine SCHD, VOO, and other ETFs in WizardFolio to reveal the actual weights at the company, sector, and country level.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/SCHD"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View SCHD holdings
          </a>
          <a
            href="/holdings/VOO"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View VOO holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
