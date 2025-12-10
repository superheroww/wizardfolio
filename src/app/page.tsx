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
import { getAnonId } from "@/lib/analytics/anonId";

type MixEventSource = "scratch" | "template" | "url";

type AnalyzeEventOptions = {
  source?: MixEventSource;
  templateKey?: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const step2Ref = useRef<HTMLDivElement | null>(null);

  const [positions, setPositions] = useState<UserPosition[]>(
    DEFAULT_POSITIONS as UserPosition[],
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [mixEventContext, setMixEventContext] =
    useState<AnalyzeEventOptions | null>(null);

  const totalWeight = positions.reduce(
    (sum, position) => sum + position.weightPct,
    0,
  );
  const totalClamped = Math.max(0, Math.min(100, totalWeight));

  const handleAnalyze = (
    overridePositions?: UserPosition[],
    eventOptions?: AnalyzeEventOptions,
  ) => {
    const sourcePositions = overridePositions ?? positions;
    setFeedbackMessage(null);

    const resolvedOptions: AnalyzeEventOptions = {
      source: eventOptions?.source ?? mixEventContext?.source ?? "scratch",
      templateKey:
        eventOptions?.templateKey ?? mixEventContext?.templateKey ?? null,
    };

    const cleanedPositions = normalizePositions(sourcePositions);
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

    // ✅ PostHog only – NO Supabase logging here anymore
    posthog.capture("analyze_clicked", {
      positions: cleanedPositions.map((position) => ({
        symbol: position.symbol.trim(),
        weightPct: position.weightPct,
      })),
      mix_name: mixName,
      positions_count: cleanedPositions.length,
      source_page: "home",
      source: resolvedOptions.source,
      template_key: resolvedOptions.templateKey ?? null,
      anon_id: getAnonId(),
    });

    // Still keep context for next Analyze calls
    setMixEventContext(resolvedOptions);

    // Navigate to results – snapshotPreviousMix handles DB logging there
    router.push(`/results?${params}`);
  };

  return (
    <main className="min-h-screen px-4 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8">
      <div className="mx-auto w-full max-w-3xl md:max-w-4xl lg:max-w-5xl space-y-6">
        {/* HERO */}
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900 md:text-3xl">
            ETF look-through for DIY investors
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
            Mix a few ETFs and we’ll show you the real stocks, sectors, and
            regions underneath.
          </p>
          <p className="text-xs text-neutral-500 md:text-sm">
            Built for long-term ETF investors who want to see what they
            actually own.
          </p>

          {/* “Designed for” chips */}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-600">
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1">
              Made for Canadian &amp; U.S. investors
            </span>
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1">
              Works with any ETF mix
            </span>
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1">
              Simple, long-term investing tools
            </span>
          </div>
        </section>

        {/* QUICK START CARD */}
        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <header className="mb-3 space-y-1">
            <h2 className="text-base font-semibold text-neutral-900">
              Try a preset — results load instantly
            </h2>
            <p className="text-xs text-neutral-600">
              Click any mix and we&apos;ll show you the stocks, sectors, and
              regions inside it.
            </p>
          </header>

          <QuickStartTemplates
            onTemplateSelect={(templatePositions, template) => {
              const isBuildYourOwn =
                template.id === "build-your-own" ||
                template.name === "Build Your Own Mix";

              posthog.capture("template_selected", {
                template_key: template.id,
                template_name: template.name,
                source_page: "home",
                anon_id: getAnonId(),
              });

              if (isBuildYourOwn) {
                setPositions(DEFAULT_POSITIONS);
                setMixEventContext(null);
                setFeedbackMessage(null);

                step2Ref.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });

                return;
              }

              setPositions(templatePositions);

              const templateOptions: AnalyzeEventOptions = {
                source: "template",
                templateKey: template.id,
              };

              setMixEventContext(templateOptions);
              handleAnalyze(templatePositions, templateOptions);
            }}
          />

          <button
            type="button"
            onClick={() => {
              const previousTotalWeight = positions.reduce(
                (sum, position) => sum + position.weightPct,
                0,
              );

              posthog.capture("click_start_from_scratch", {
                previous_positions_count: positions.length,
                previous_total_weight: previousTotalWeight,
                reset_mode: "defaults",
                source_page: "home",
                anon_id: getAnonId(),
              });

              setPositions(DEFAULT_POSITIONS);
              setFeedbackMessage(null);
              setMixEventContext(null);

              step2Ref.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-white active:scale-[0.98]"
          >
            Start from a fresh mix
          </button>
        </section>

        {/* PORTFOLIO INPUT — single strong card, title lives inside component */}
        <section ref={step2Ref} className="space-y-3">
          <div className="space-y-1 text-[11px] text-neutral-500">
            <p className="font-medium uppercase tracking-[0.12em] text-neutral-500">
              How it works
            </p>
            <ol className="space-y-1 text-[11px] text-neutral-600">
              <li>1. Add your ETFs and their allocations.</li>
              <li>2. We look through all the underlying holdings.</li>
              <li>
                3. You see the real stocks, sectors, regions, and benchmark
                tilts.
              </li>
            </ol>
          </div>

          <PortfolioInput
            positions={positions}
            onChange={setPositions}
            onAnalyze={() => handleAnalyze()}
          />

          {feedbackMessage && (
            <p className="text-xs text-rose-500">{feedbackMessage}</p>
          )}

          <div className="mt-3 space-y-1 text-[11px] text-neutral-500">
            <p>For education only. This isn&apos;t investment advice.</p>
            <p>
              No login required to try it. We don&apos;t manage money or trade —
              we just analyze what&apos;s inside your ETFs.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}