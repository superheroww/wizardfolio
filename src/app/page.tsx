"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import PortfolioInput from "@/components/PortfolioInput";
import QuickStartTemplates from "@/components/QuickStartTemplates";
import { DEFAULT_POSITIONS } from "@/data/defaultPositions";
import { UserPosition } from "@/lib/exposureEngine";
import {
  buildPositionsSearchParams,
  normalizePositions,
} from "@/lib/positionsQuery";
import { formatMixSummary } from "@/lib/mixFormatting";

export default function HomePage() {
  const router = useRouter();
  const analyzeSectionRef = useRef<HTMLDivElement | null>(null);
  const [positions, setPositions] = useState<UserPosition[]>(
    DEFAULT_POSITIONS as UserPosition[]
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const totalWeight = positions.reduce(
    (sum, position) => sum + position.weightPct,
    0
  );
  const totalClamped = Math.max(0, Math.min(100, totalWeight));

  const samplePortfolio: UserPosition[] = [
    { symbol: "VTI", weightPct: 55 },
    { symbol: "VXUS", weightPct: 25 },
    { symbol: "XIC.TO", weightPct: 20 },
  ];

  const handleAnalyze = (overridePositions?: UserPosition[]) => {
    const source = overridePositions ?? positions;
    setFeedbackMessage(null);

    const cleanedPositions = normalizePositions(source);
    if (!cleanedPositions.length) {
      setFeedbackMessage("Please add some ETFs and try again.");
      return;
    }

    const params = buildPositionsSearchParams(cleanedPositions);
    if (!params) {
      setFeedbackMessage("Please add some ETFs and try again.");
      return;
    }

    const mixName = formatMixSummary(cleanedPositions);
    posthog.capture("analyze_clicked", {
      positions: cleanedPositions.map((position) => ({
        symbol: position.symbol.trim(),
        weightPct: position.weightPct,
      })),
      mix_name: mixName,
      positions_count: cleanedPositions.length,
      source_page: "home",
    });

    router.push(`/results?${params}`);
  };

  const scrollToAnalyzer = () => {
    if (analyzeSectionRef.current) {
      analyzeSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSampleAnalyze = () => {
    setPositions(samplePortfolio);
    handleAnalyze(samplePortfolio);
  };

  const howItWorks = [
    {
      title: "1. Enter your mix",
      copy: "Type ETFs like VOO, QQQ, XEQT, VEQT and set your weights.",
    },
    {
      title: "2. We look through the ETFs",
      copy: "WizardFolio looks inside each ETF down to the stock level.",
    },
    {
      title: "3. See your true exposure",
      copy: "Instant breakdown by stock, sector, and region—no spreadsheet needed.",
    },
  ];

  const whyItMatters = [
    {
      title: "Spot hidden concentration",
      copy: "See which stocks you’re truly overweight so you can rebalance with confidence.",
    },
    {
      title: "Balance regions and sectors",
      copy: "Uncover home bias and sector tilts before they skew your returns.",
    },
    {
      title: "ETF look-through only",
      copy: "No logins or account connections. Just enter ETFs and weights and we handle the look-through math.",
    },
  ];

  return (
    <main className="bg-[--background] text-[--text-primary]">
      <section className="border-b border-[--color-border-subtle] bg-[--muted-strong]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-12 md:flex-row md:items-start md:py-16">
          <div className="w-full max-w-2xl flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[--color-border-subtle] bg-[--muted] px-3 py-1 text-xs font-medium text-[--text-secondary]">
              WizardFolio · ETF look-through
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-[--text-primary] sm:text-4xl">
                Mix ETFs. See your true exposure.
              </h1>
              <p className="max-w-xl text-sm text-[--text-secondary]">
                Free ETF look-through for Canadian and U.S. investors. Just type
                your tickers and weights—no logins, billing, or extra setup
                required.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToAnalyzer}
                className="inline-flex items-center justify-center rounded-full bg-[--color-accent] px-5 py-2 text-sm font-medium text-white transition hover:bg-[--accent-hover]"
              >
                Analyze your mix
              </button>
              <button
                type="button"
                onClick={handleSampleAnalyze}
                className="inline-flex items-center justify-center rounded-full border border-[--color-border-subtle] bg-[--muted] px-5 py-2 text-sm font-medium text-[--text-primary] transition hover:bg-[--muted-strong]"
              >
                Try a sample portfolio
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="rounded-3xl border border-[--color-border-subtle] bg-[--muted] p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[--text-secondary]">
                    Sample preview
                  </p>
                  <p className="text-sm text-[--text-primary]">
                    VTI · VXUS · XIC.TO
                  </p>
                </div>
                <span className="rounded-full bg-[--muted-strong] px-3 py-1 text-xs font-semibold text-[--text-primary]">
                  3 holdings
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-[--color-border-subtle] bg-[--muted] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[--text-secondary]">
                    Region tilt
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[--text-secondary]">
                      <span>North America</span>
                      <span>68%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[--muted-strong]">
                      <div
                        className="h-full rounded-full bg-[--color-accent]"
                        style={{ width: "68%" }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[--text-secondary]">
                      <span>International</span>
                      <span>32%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[--muted-strong]">
                      <div
                        className="h-full rounded-full bg-[--text-secondary]"
                        style={{ width: "32%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-[--color-border-subtle] bg-[--muted] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[--text-secondary]">
                    Sector view
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Tech", value: "29%" },
                      { label: "Financials", value: "18%" },
                      { label: "Industrials", value: "14%" },
                    ].map((sector) => (
                      <div
                        key={sector.label}
                        className="flex items-center justify-between rounded-xl bg-[--muted-strong] px-3 py-2 text-xs text-[--text-primary] shadow-sm"
                      >
                        <span>{sector.label}</span>
                        <span className="font-semibold">{sector.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        <section
          ref={analyzeSectionRef}
        >
          <div className="space-y-6 rounded-3xl border border-[--color-border-subtle] bg-[--muted] p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[--text-secondary]">
                Get started
              </h2>
              <p className="text-sm text-[--text-secondary]">
                Try a preset ETF mix in seconds, then customize it to match your
                real portfolio.
              </p>
            </div>

            <QuickStartTemplates
              onTemplateSelect={(templatePositions, template) => {
                const isBuildYourOwn = template.name === "Build Your Own Mix";

                if (isBuildYourOwn) {
                  setPositions(DEFAULT_POSITIONS);
                  if (analyzeSectionRef.current) {
                    analyzeSectionRef.current.scrollIntoView({
                      behavior: "smooth",
                    });
                  }
                  return;
                }

                setPositions(templatePositions);
                handleAnalyze(templatePositions);
              }}
            />

            <button
              type="button"
              onClick={() => {
                const previousTotalWeight = positions.reduce(
                  (sum, position) => sum + position.weightPct,
                  0
                );

                posthog.capture("click_start_from_scratch", {
                  previous_positions_count: positions.length,
                  previous_total_weight: previousTotalWeight,
                  reset_mode: "defaults",
                });

                setPositions(DEFAULT_POSITIONS);
                setFeedbackMessage(null);
                if (analyzeSectionRef.current) {
                  analyzeSectionRef.current.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
              className="text-xs font-semibold text-[--text-secondary] underline underline-offset-2"
            >
              Or start from scratch
            </button>

            <div className="space-y-3 border-t border-[--color-border-subtle] pt-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">Or enter your own ETF mix</h3>
                <p className="mb-3 text-xs text-[--text-secondary]">
                  Use tickers and weights that match how you actually invest—for
                  example, 50% VOO, 30% QQQ, 20% XEQT.
                </p>
              </div>

              <PortfolioInput
                positions={positions}
                onChange={setPositions}
                onAnalyze={() => handleAnalyze()}
              />

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-[--text-secondary]">
                  <span>Total allocation</span>
                  <span>{totalWeight.toFixed(0)}% of 100%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[--muted-strong]">
                  <div
                    className={`h-full rounded-full ${
                      totalWeight === 100
                        ? "bg-emerald-500"
                        : "bg-[--text-secondary]"
                    }`}
                    style={{ width: `${totalClamped}%` }}
                  />
                </div>
              </div>

              {feedbackMessage && (
                <p className="text-xs text-rose-500">
                  {feedbackMessage}
                </p>
              )}

              <div className="mt-3 space-y-1 text-[11px] text-[--text-secondary]">
                <p>
                  Tap “See my breakdown →” to view your stocks, sectors, and
                  regions.
                </p>
                <p>For education only. This isn’t investment advice.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
