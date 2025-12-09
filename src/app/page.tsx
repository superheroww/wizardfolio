"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
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

const sendMixAnalyzeEvent = async (
  positions: UserPosition[],
  options?: AnalyzeEventOptions,
) => {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return;
  }

  const payload = {
    positions,
    benchmarkSymbol: null,
    source: options?.source ?? "scratch",
    templateKey: options?.templateKey ?? null,
    referrer:
      typeof document !== "undefined" && document.referrer
        ? document.referrer
        : "$direct",
    anonId: getAnonId(),
  };

  try {
    const { data: sessionData } =
      await getSupabaseBrowserClient().auth.getSession();
    const token = sessionData?.session?.access_token;

    if (token) {
      await fetch("/api/mix-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      return;
    }

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/mix-events", blob);
    }
  } catch (error) {
    console.error("error: ", error);
  }
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

    setMixEventContext(resolvedOptions);
    sendMixAnalyzeEvent(cleanedPositions, resolvedOptions);

    router.push(`/results?${params}`);
  };

  return (
    <main className="min-h-screen px-4 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* HERO */}
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-900 md:text-3xl">
            ETF Look-Through
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
            Mix a few ETFs and we’ll show you the real stocks, sectors, and
            regions underneath.
          </p>
        </section>

        {/* QUICK START CARD */}
        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
          <header className="mb-3">
            <h2 className="text-base font-semibold text-neutral-900">
              Choose a starting mix
            </h2>
            <p className="text-sm text-neutral-700">
              Pick a preset below or begin with your own ETF mix.
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
          </div>
        </section>
      </div>
    </main>
  );
}