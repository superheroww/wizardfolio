import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – WizardFolio",
  description:
    "Learn how WizardFolio handles accounts, saved mixes, analytics, and portfolio inputs.",
};

const LAST_UPDATED = "December 6, 2025";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Legal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-4 text-sm text-neutral-700 sm:text-base">
          <p>
            WizardFolio (&quot;we&quot;, &quot;us&quot;, or &quot;the service&quot;) is an ETF analysis and
            portfolio visualization tool designed for informational use. This Privacy Policy explains what
            data we collect and how we handle it, including when you create an account and save mixes to your
            dashboard.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Information We Collect
            </h2>
            <p>
              WizardFolio is designed to collect a minimal amount of information. Depending on how you use the
              service, we may process:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <span className="font-medium">Anonymous usage analytics</span> such as page views, browser
                type, device information, approximate location, and which features are used. This helps us
                understand how people interact with the product.
              </li>
              <li>
                <span className="font-medium">Portfolio inputs or ETF mixes</span> that you enter into the tool
                (for example, tickers and target weights). These are used to compute your look-through
                analysis and, in aggregate, to understand which types of mixes people explore.
              </li>
              <li>
                <span className="font-medium">Account information</span> if you choose to sign up, such as your
                email address and basic profile information managed by our authentication provider. Passwords
                are handled by Supabase Auth and are never stored or visible in plain text to us.
              </li>
              <li>
                <span className="font-medium">Saved mixes and dashboard data</span> if you use the &quot;Save
                this mix&quot; feature. We store the mix name and the ETFs and weights you saved so we can
                reload your analysis on the dashboard.
              </li>
              <li>
                <span className="font-medium">Session and identifier data</span> such as cookies or local
                storage tokens that keep you signed in and allow us to associate anonymous usage with your
                browser or account (for example, an anonymous ID for mix events or a session ID for your
                account).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Information We Do Not Collect
            </h2>
            <p>
              WizardFolio does <span className="font-semibold">not</span> collect or store:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Brokerage credentials or financial account numbers</li>
              <li>Trading permissions, orders, or the ability to move money</li>
              <li>Government-issued identifiers</li>
              <li>
                Personal identifying information beyond what is needed for your account (such as an email
                address) unless you choose to contact us directly and share additional details
              </li>
            </ul>
            <p>
              Authentication (including password handling) is provided by Supabase Auth. We do not see or store
              your password in plain text.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              How We Use Data
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Provide the ETF look-through analysis you request</li>
              <li>
                Run account features such as sign-in, maintaining your session, and showing your saved mixes on
                the dashboard
              </li>
              <li>
                Improve features and user experience by analyzing how the service is used (for example, which
                mixes or views are most popular)
              </li>
              <li>Monitor product performance, reliability, and security</li>
              <li>
                Communicate with you if you contact us directly (for example, to respond to a support question)
              </li>
            </ul>
            <p>
              We may use aggregated and anonymized data (for example, broad statistics on ETF usage) to
              understand trends. This aggregated information does not identify individual users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Cookies and Local Storage
            </h2>
            <p>
              WizardFolio may use cookies and similar technologies (such as local storage) to:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Keep you signed in after you log into your account</li>
              <li>Remember basic preferences</li>
              <li>
                Track anonymous product usage (for example, an anonymous ID used to understand how mixes are
                created and explored)
              </li>
            </ul>
            <p>
              You can control cookies through your browser settings, but disabling them may limit certain
              features, such as staying signed in or saving mixes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Third-Party Services
            </h2>
            <p>WizardFolio uses trusted third-party providers to operate the service, including:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Vercel for hosting the application</li>
              <li>Supabase for authentication, database, and storage</li>
              <li>
                Analytics tools such as PostHog or Google Analytics to understand usage and improve the
                product
              </li>
            </ul>
            <p>
              These services may process usage data as part of providing their infrastructure and analytics
              capabilities. We aim to use privacy-conscious defaults and do not sell your data or use it for
              targeted advertising.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Data Retention
            </h2>
            <p>
              Usage data and portfolio inputs may be retained for analytics and product improvement purposes.
              Saved mixes and account data are retained while your account is active so we can show your
              dashboard and restore your mixes when you sign in.
            </p>
            <p>
              If you delete a saved mix, it will no longer appear in your dashboard. We may keep limited
              aggregated or anonymized analytics derived from historical data even after specific records are
              removed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Children&apos;s Privacy
            </h2>
            <p>
              WizardFolio is intended for adults and is not directed at children. If you believe a child has
              provided us with personal information, please contact us so we can review and take appropriate
              action.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time as the product evolves. When we make changes,
              we will update the &quot;Last updated&quot; date at the top of this page. Your continued use of
              WizardFolio after any changes means you accept the updated policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy, you can reach us at{" "}
              <a
                href="mailto:support@wizardfolio.com"
                className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
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