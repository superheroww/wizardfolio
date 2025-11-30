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

export default function HomePage() {
  const router = useRouter();
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const [positions, setPositions] = useState<UserPosition[]>(
    DEFAULT_POSITIONS as UserPosition[]
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const totalWeight = positions.reduce((sum, position) => sum + position.weightPct, 0);
  const totalClamped = Math.max(0, Math.min(100, totalWeight));

  const handleAnalyze = (overridePositions?: UserPosition[]) => {
    const source = overridePositions ?? positions;
    setFeedbackMessage(null);

    const totalWeightForEvent = source.reduce(
      (sum, position) => sum + position.weightPct,
      0
    );

    posthog.capture("click_analyze", {
      positions_count: source.length,
      total_weight: totalWeightForEvent,
      source: overridePositions ? "template" : "manual",
    });

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

    router.push(`/results?${params}`);
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            ETF Look-Through
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Mix a few ETFs and we’ll show you the real stocks, sectors, and regions underneath.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Step 1 · Pick a starting point
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Tap a preset or start from scratch.
            </p>
          </div>

        <QuickStartTemplates
          onTemplateSelect={(templatePositions, template) => {
            const templateName = template.name;
            const isBuildYourOwn = templateName === "Build Your Own Mix";
            const totalWeightForEvent = templatePositions.reduce(
              (sum, position) => sum + (position.weightPct ?? 0),
              0
            );

            posthog.capture("click_template", {
              template_name: templateName,
              is_build_your_own: isBuildYourOwn,
              positions_count: templatePositions.length,
              total_weight: totalWeightForEvent,
              triggered_action: isBuildYourOwn ? "scroll_to_step_2" : "analyze",
            });

            if (isBuildYourOwn) {
              setPositions(DEFAULT_POSITIONS);
              if (step2Ref.current) {
                step2Ref.current.scrollIntoView({ behavior: "smooth" });
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
            if (step2Ref.current) {
              step2Ref.current.scrollIntoView({ behavior: "smooth" });
            }
          }}
            className="mt-2 inline-flex items-center justify-center text-xs font-semibold text-zinc-600 underline underline-offset-2 dark:text-zinc-300"
          >
            Or start from scratch
          </button>
        </section>

        <section
          ref={step2Ref}
          className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Step 2 · Adjust your mix
            </p>
          </div>

          <PortfolioInput
            positions={positions}
            onChange={setPositions}
            onAnalyze={() => handleAnalyze()}
          />

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>Total allocation</span>
              <span>{totalWeight.toFixed(0)}% of 100%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${
                  totalWeight === 100
                    ? "bg-emerald-500"
                    : "bg-zinc-500 dark:bg-zinc-400"
                }`}
                style={{ width: `${totalClamped}%` }}
              />
            </div>
          </div>

          {feedbackMessage && (
            <p className="text-xs text-rose-500 dark:text-rose-400">
              {feedbackMessage}
            </p>
          )}

          <div className="mt-3 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <p>
              Step 3 · Tap “See my breakdown →” to view your stocks, sectors, and regions.
            </p>
            <p>
              For education only. This isn’t investment advice.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
