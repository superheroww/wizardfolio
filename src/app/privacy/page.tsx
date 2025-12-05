import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – WizardFolio",
  description:
    "Learn how WizardFolio handles data, analytics, and portfolio inputs.",
};

const LAST_UPDATED = "December 5, 2025";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-zinc-400">
            Legal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-50 sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-500 dark:text-zinc-400">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-4 text-sm text-neutral-700 dark:text-zinc-300 sm:text-base">
          <p>
            WizardFolio (&quot;we&quot;, &quot;us&quot;, or &quot;the service&quot;) is an ETF analysis and
            portfolio visualization tool designed for informational use. This Privacy Policy explains what
            data we collect and how we handle it.
          </p>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              Information We Collect
            </h2>
            <p>
              WizardFolio is designed to collect a minimal amount of information. When you use the service,
              we may process:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <span className="font-medium">Anonymous usage analytics</span> such as page views, browser
                type, and device information.
              </li>
              <li>
                <span className="font-medium">Portfolio inputs or ETF mixes</span> that you enter into the tool.
                These are stored without personal identifiers and used to provide results and understand how the
                product is used.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              Information We Do Not Collect
            </h2>
            <p>
              WizardFolio does <span className="font-semibold">not</span> collect or store:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Brokerage credentials or financial account numbers</li>
              <li>Passwords or authentication tokens</li>
              <li>Government-issued identifiers</li>
              <li>Personal identifying information unless you choose to contact us directly</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              How We Use Data
            </h2>
            <p>We use aggregated and anonymized data to:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Improve features and user experience</li>
              <li>Analyze product usage and performance</li>
              <li>Ensure the reliability and security of the service</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              Third-Party Services
            </h2>
            <p>WizardFolio uses trusted third-party providers to operate the service, including:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Vercel for hosting</li>
              <li>Supabase for database and storage</li>
              <li>Analytics tools such as PostHog or Google Analytics</li>
            </ul>
            <p>
              These services may process non-identifiable usage data as part of providing their infrastructure
              and analytics capabilities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              Data Retention
            </h2>
            <p>
              Usage data and portfolio inputs may be retained for analytics and product improvement purposes.
              If you contact us and share information, we may retain that correspondence as needed to respond
              and maintain records.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-zinc-50 sm:text-base">
              Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy, you can reach us at{" "}
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
