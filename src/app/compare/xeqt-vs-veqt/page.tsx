import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XEQT vs VEQT: ETF Comparison | WizardFolio",
  description:
    "Compare XEQT and VEQT: two Canadian all-in-one equity ETFs with different issuer mixes and exposures. Mix them with other ETFs and see the true stock-level exposure using WizardFolio.",
};

export default function XeqtVsVeqtPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ETF comparison
        </p>
        <h1 className="text-2xl font-semibold ">
          XEQT vs VEQT: What’s the difference?
        </h1>
        <p className="text-sm text-muted-foreground">
          XEQT and VEQT are Canadian-listed, 100% equity ETFs that give investors exposure to a global mix of stocks. XEQT comes from iShares while VEQT is built by Vanguard, so their issuer mixes and underlying ETFs differ slightly even though they share a similar goal.
        </p>
      </section>

      <section className="rounded-2xl border bg-card/50 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide">Quick comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 pb-2 text-xs text-muted-foreground"> </th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">XEQT</th>
                <th className="border-b px-2 pb-2 text-xs font-semibold text-muted-foreground">VEQT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Index / exposure</td>
                <td className="py-2 pr-4 text-sm">Global equities with a slight tilt toward developed markets.</td>
                <td className="py-2 pr-4 text-sm">Global equities that combine Vanguard’s international and U.S. building blocks.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Equity allocation</td>
                <td className="py-2 pr-4 text-sm">~100% equities.</td>
                <td className="py-2 pr-4 text-sm">~100% equities.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-xs text-muted-foreground">Underlying structure</td>
                <td className="py-2 pr-4 text-sm">iShares building blocks and regional ETFs.</td>
                <td className="py-2 pr-4 text-sm">Vanguard’s U.S., international, and emerging market ETF combo.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-xs text-muted-foreground">Typical use</td>
                <td className="py-2 pr-4 text-sm">One ticket global equity exposure for Canadian investors.</td>
                <td className="py-2 pr-4 text-sm">A similar all-in-one choice that leans on Vanguard’s ETF lineup.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/40 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-sm font-medium">How investors often use XEQT</p>
          <p className="text-sm text-muted-foreground">
            Many investors use XEQT as a single security that captures a wide global equity pool via iShares ETFs, making it easy to own an international blend without managing multiple holdings.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium ">How investors often use VEQT</p>
          <p className="text-sm text-muted-foreground">
            Some investors choose VEQT when they prefer Vanguard’s mix of U.S., international, and emerging market ETFs, then rely on it as their core global equity sleeve.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4 text-sm">
        <p className="mb-2 text-sm font-medium ">Mix XEQT and VEQT and see your true exposure</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Mix XEQT, VEQT, and other ETFs through WizardFolio to see the actual stock-, sector-, and region-level exposure you end up with instead of guessing from the label.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try your own mix →
          </a>
          <a
            href="/holdings/XEQT.TO"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View XEQT.TO holdings
          </a>
          <a
            href="/holdings/VEQT.TO"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View VEQT.TO holdings
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This page is for general information only and isn&apos;t a recommendation to buy or sell any investment.
        </p>
      </section>
    </div>
  );
}
