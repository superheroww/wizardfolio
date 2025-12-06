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
    question: "Do I need an account to use WizardFolio?",
    answer:
      "No account is required for the basic look-through. You can paste or type an ETF mix and see your stock, sector, and region exposure without signing in. Creating an account is optional and only needed if you want to save mixes and revisit them later.",
  },
  {
    question: "What does signing in unlock?",
    answer:
      "When you sign in with email and password, you can save mixes to your dashboard, rename them, and come back later to load them again. The goal is to let you keep a small library of your real portfolios or favourite ETF ideas without retyping them each time.",
  },
  {
    question: "What does “Save this mix” actually store?",
    answer:
      "When you click “Save this mix,” WizardFolio stores the mix name plus the ETFs and weights you entered so it can rebuild the analysis later. It does not connect to your brokerage, place trades, or move any money—it only saves the mix configuration inside WizardFolio.",
  },
  {
    question: "Are my saved mixes private?",
    answer:
      "Saved mixes are tied to your account and are not shared publicly by default. We use them to show you your own dashboard and to understand, in aggregate, which types of mixes people are exploring so we can improve the product.",
  },
  {
    question: "Is WizardFolio free to use?",
    answer:
      "The core look-through tool is free during the beta. We may introduce a paid tier later with additional features, but the basic analysis and saving a small number of mixes to your dashboard will remain free.",
  },
  {
    question: "Do you record analytics?",
    answer:
      "We use privacy-focused analytics to understand how people use WizardFolio and to improve the product. We do not sell data or use it for advertising.",
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
    "Answers to common questions about WizardFolio, ETF look-through analysis, supported ETFs, pricing, sign-in, and saving mixes to your dashboard.",
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <section className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Help &amp; support
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Frequently asked questions
          </h1>
          <p className="text-sm text-neutral-700">
            Here are some common questions about how WizardFolio works, which ETFs
            we support, and what you can expect from the ETF look-through analysis
            and saved mixes.
          </p>
        </section>

        <section className="space-y-6">
          {faqEntries.map((entry) => (
            <article
              key={entry.question}
              className="rounded-2xl border border-neutral-200 bg-white/80 p-4"
            >
              <h2 className="text-base font-semibold text-neutral-900">
                {entry.question}
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                {entry.answer}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700">
          <h2 className="mb-2 text-base font-semibold text-neutral-900">
            Ready to see what you actually own?
          </h2>
          <p className="mb-3 text-sm text-neutral-700">
            Mix ETFs like VOO, QQQ, XEQT, and VEQT and instantly see your true
            stock, sector, and region exposure. You can use the core look-through
            with no sign-up, and optionally create a free account to save mixes to
            your dashboard and revisit them later.
          </p>
          <a
            href="/"
            className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            Try the ETF look-through →
          </a>
        </section>
      </div>
    </>
  );
}