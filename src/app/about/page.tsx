import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WizardFolio",
  description:
    "Learn what WizardFolio is, why it exists, and how it helps Canadian investors understand their ETF portfolios.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-zinc-400">
            About
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-50 sm:text-3xl">
            WizardFolio
          </h1>
          <p className="text-sm text-neutral-600 dark:text-zinc-300 sm:text-base">
            WizardFolio is a minimalist ETF look-through and portfolio analysis tool built for investors. It helps you see what&apos;s inside your ETFs, how your portfolio is allocated across sectors and countries, and how different mixes compare.
          </p>
        </div>

        <div className="space-y-3 text-sm text-neutral-700 dark:text-zinc-300 sm:text-base">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              Why WizardFolio exists
            </h2>
            <p>
              Many investors hold a handful of broad-market ETFs, but it&apos;s not always obvious how much overlap there is between them or how concentrated the portfolio really is. WizardFolio focuses on clarity: a simple way to see your underlying holdings and exposures without dashboards that feel like enterprise software.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              What WizardFolio does
            </h2>
            <ul className="list-disc space-y-1 pl-4">
              <li>Breaks down ETF holdings into companies, sectors, and countries.</li>
              <li>Helps you compare mixes of ETFs side by side.</li>
              <li>Stays focused on transparency rather than predictions or stock picks.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              Contact
            </h2>
            <p>
              If you have feedback, questions, or you&apos;ve spotted something that doesn&apos;t look right, you can reach us at{" "}
              <a
                href="mailto:support@wizardfolio.com"
                className="font-medium text-neutral-900 dark:text-zinc-50 underline underline-offset-2"
              >
                support@wizardfolio.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
