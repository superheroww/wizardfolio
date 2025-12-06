import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use – WizardFolio",
  description:
    "Read the terms that govern the use of the WizardFolio ETF analysis and portfolio visualization tool.",
};

const LAST_UPDATED = "December 5, 2025";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Legal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Terms of Use
          </h1>
          <p className="text-xs text-neutral-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-4 text-sm text-neutral-700 sm:text-base">
          <p>
            By accessing or using WizardFolio (&quot;the service&quot;), you agree to these Terms of Use.
            If you do not agree with these terms, you should not use the service.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Informational Use Only
            </h2>
            <p>
              WizardFolio is an informational tool designed to help users visualize ETF holdings and portfolio
              allocations. It does not provide financial advice, investment recommendations, or personalized
              financial planning.
            </p>
            <p>
              You should not make investment decisions based solely on information from WizardFolio. Always
              consider consulting a qualified financial professional for advice tailored to your situation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              No Guarantees of Accuracy
            </h2>
            <p>
              Data used by WizardFolio may rely on third-party sources and may contain errors, omissions, or
              delays. We do not guarantee the accuracy, completeness, or timeliness of any information presented.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Limitation of Liability
            </h2>
            <p>
              WizardFolio is provided &quot;as is&quot; without warranties of any kind, whether express or implied.
              To the maximum extent permitted by law, WizardFolio and its creators are not liable for any direct,
              indirect, incidental, or consequential damages arising out of or related to your use of the service.
            </p>
            <p>
              This includes, without limitation, any loss of capital, trading losses, or missed opportunities
              resulting from reliance on the service or any errors in the data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              User Responsibilities
            </h2>
            <p>By using WizardFolio, you agree to:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Use the service only for lawful purposes.</li>
              <li>
                Not attempt to reverse engineer, disrupt, or interfere with the operation or security of the service.
              </li>
              <li>
                Understand that all outputs are for educational and informational purposes and not a guarantee of
                future results.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Changes to the Service
            </h2>
            <p>
              We may modify, update, or discontinue parts of the service at any time, with or without notice. We
              may also update these Terms of Use from time to time. Continued use of the service after changes
              become effective constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Contact
            </h2>
            <p>
              If you have questions about these Terms of Use, you can reach us at{" "}
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
