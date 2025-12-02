import type { Metadata } from "next";

const faqEntries = [
  {
    question: "What is WizardFolio?",
    answer:
      "WizardFolio is a free ETF look-through tool that helps investors see the underlying stocks, sectors, and regions inside ETF mixes. It is for general information only and not personalized investment advice.",
  },
  {
    question: "What is ETF look-through analysis?",
    answer:
      "ETF look-through means decomposing ETFs into their published holdings and aggregating the weights so you can see your true exposure by stock, sector, and region instead of relying on just ticker names.",
  },
  {
    question: "Which ETFs does WizardFolio support?",
    answer:
      "We focus on popular U.S. and Canadian ETFs like VOO, QQQ, XEQT, VEQT, VGRO, XGRO, VFV, XIC, and others. Coverage is expanding, so the list isn’t exhaustive yet.",
  },
  {
    question: "Does WizardFolio support Canadian ETFs?",
    answer:
      "Yes. WizardFolio is built with Canadian investors in mind and supports many TSX-listed tickers such as XEQT.TO, VEQT.TO, VGRO.TO, XBAL.TO, VFV.TO, and XIC.TO.",
  },
  {
    question: "How does WizardFolio calculate stock, sector, and region exposure?",
    answer:
      "We use each ETF’s published holdings and the weights you assign to the ETF mix to compute combined exposures across stocks, sectors, and regions.",
  },
  {
    question: "Is WizardFolio free to use?",
    answer:
      "The core look-through tool is free during the beta. We may introduce a paid tier later with additional features, but the basic analysis will remain free.",
  },
  {
    question: "Do you give investment advice or recommendations?",
    answer:
      "No. WizardFolio is educational and informational only. You should do your own research or speak with a professional before making investment decisions.",
  },
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqEntries.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: entry.answer,
    },
  })),
} as const;

export const metadata: Metadata = {
  title: "FAQ | WizardFolio",
  description:
    "Answers to common questions about WizardFolio, ETF look-through analysis, supported ETFs, pricing, and how we calculate stock, sector, and region exposure.",
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Help &amp; support
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Frequently asked questions
          </h1>
          <p className="text-sm text-zinc-600">
            Here are some common questions about how WizardFolio works, which ETFs
            we support, and what you can expect from the ETF look-through analysis.
          </p>
        </section>

        <section className="space-y-6">
          {faqEntries.map((entry) => (
            <article
              key={entry.question}
              className="rounded-2xl border bg-card/50 p-4 md:p-5 shadow-sm"
            >
              <h2 className="text-sm md:text-base font-semibold text-zinc-900">
                {entry.question}
              </h2>
              <p className="mt-2 text-sm md:text-[0.95rem] leading-relaxed text-zinc-700">
                {entry.answer}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border bg-card/40 p-4 md:p-5 text-sm text-zinc-600">
          <h2 className="mb-2 text-sm font-medium text-zinc-900">
            Ready to see what you actually own?
          </h2>
          <p className="mb-3 text-sm leading-relaxed">
            Mix ETFs like VOO, QQQ, XEQT, and VEQT and instantly see your true
            stock, sector, and region exposure. No signup required for the basic
            look-through.
          </p>
          <a
            href="/"
            className="inline-flex rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border hover:bg-accent"
          >
            Try the ETF look-through →
          </a>
        </section>
      </div>
    </>
  );
}
