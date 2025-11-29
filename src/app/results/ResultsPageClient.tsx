"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type TouchEvent,
} from "react";
import ExposureSummary from "@/components/ExposureSummary";
import HoldingsTable from "@/components/HoldingsTable";
import RegionExposureChart from "@/components/RegionExposureChart";
import { useRouter } from "next/navigation";
import { AppleShareIcon } from "@/components/icons/AppleShareIcon";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import { normalizePositions } from "@/lib/positionsQuery";
import { UserPosition } from "@/lib/exposureEngine";
import { useImageShare } from "@/hooks/useImageShare";

type ApiExposureRow = {
  holding_symbol: string;
  holding_name: string;
  country?: string | null;
  sector?: string | null;
  asset_class?: string | null;
  total_weight_pct: number;
};

type SubmissionState = "idle" | "loading" | "success" | "error";

const FEATURE_OPTIONS = [
  "More ETF coverage",
  "Support individual stocks",
  "Connect my real portfolio",
  "More ETF insights & charts",
  "Multi-currency insights (CAD vs USD)",
  "Something else…",
];

type ResultsPageClientProps = {
  initialPositions: UserPosition[];
  positionsQueryString: string;
  hasPositionsParam: boolean;
};

const EMPTY_POSITIONS_ERROR =
  "At least one ETF with a non-empty symbol and positive weight is required";

export default function ResultsPageClient({
  initialPositions,
  positionsQueryString,
  hasPositionsParam,
}: ResultsPageClientProps) {
  const router = useRouter();
  const { capture } = usePostHogSafe();

  const sanitizedPositions = useMemo(
    () => normalizePositions(initialPositions),
    [initialPositions]
  );
  const hasValidPositions = sanitizedPositions.length > 0;
  const positions = hasValidPositions ? sanitizedPositions : initialPositions;

  const [exposure, setExposure] = useState<ApiExposureRow[]>([]);
  const [slide, setSlide] = useState<0 | 1 | 2 | 3>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [feedbackState, setFeedbackState] = useState<SubmissionState>("idle");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { shareElementAsImage, isSharing } = useImageShare();

  const top10 = useMemo(
    () =>
      [...exposure]
        .sort(
          (a, b) =>
            (b.total_weight_pct ?? 0) - (a.total_weight_pct ?? 0)
        )
        .slice(0, 10),
    [exposure]
  );

  useEffect(() => {
    const slideName =
      slide === 0
        ? "Exposure"
        : slide === 1
        ? "Region"
        : slide === 2
        ? "Holdings"
        : "Feedback";

    capture("results_slide_viewed", {
      slide_index: slide,
      slide_name: slideName,
      has_exposure: exposure.length > 0,
    });
  }, [slide, exposure.length, capture]);

  useEffect(() => {
    if (!sanitizedPositions.length) {
      setExposure([]);
      setError(
        hasPositionsParam ? EMPTY_POSITIONS_ERROR : null
      );
      setIsLoading(false);
      setSlide(0);
      return;
    }

    const fetchExposure = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/etf-exposure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positions: sanitizedPositions }),
        });

        const body = (await res.json().catch(() => null)) as
          | { exposure?: ApiExposureRow[]; error?: string }
          | null;

        if (!res.ok) {
          throw new Error(body?.error || "Failed to analyze portfolio.");
        }

        const holdings = body?.exposure ?? [];

        setExposure(holdings);
        capture("results_viewed", {
          num_holdings: holdings.length,
          num_etfs: sanitizedPositions.length,
          top_symbols: sanitizedPositions
            .map((p) => p.symbol)
            .slice(0, 5),
        });
      } catch (err: any) {
        console.error("Exposure API error:", err);
        setExposure([]);
        const message =
          err?.message ||
          "Something went wrong while analyzing your mix.";

        setError(message);

        capture("exposure_error", {
          error_message: String(message).slice(0, 200),
          num_etfs: sanitizedPositions.length,
        });
      } finally {
        setIsLoading(false);
        setSlide(0);
      }
    };

    fetchExposure();
  }, [sanitizedPositions, capture, hasPositionsParam]);

  const handleEditInputs = () => {
    if (positionsQueryString) {
      router.push(`/?${positionsQueryString}`);
    } else {
      router.push("/");
    }
  };

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;

    await shareElementAsImage(cardRef.current, {
      fileName: "wizardfolio-exposure.png",
      title: "WizardFolio ETF exposure",
      text: "ETF look-through powered by WizardFolio (wizardfolio.com)",
    });

    capture("results_shared", {
      method: "image_share",
      has_exposure: exposure.length > 0,
    });
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) =>
    setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        setSlide((prev) => (prev === 3 ? 3 : ((prev + 1) as 0 | 1 | 2 | 3)));
      } else {
        setSlide((prev) => (prev === 0 ? 0 : ((prev - 1) as 0 | 1 | 2 | 3)));
      }
    }

    setTouchStartX(null);
  };

  const title = (() => {
    switch (slide) {
      case 0:
        return "Your true exposure";
      case 1:
        return "By region";
      case 2:
        return "Top holdings";
      case 3:
        return "Help shape WizardFolio";
      default:
        return "Your true exposure";
    }
  })();

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const hasSomethingElse = selectedFeatures.includes("Something else…");
  const isSubmittingFeedback = feedbackState === "loading";

  const handleFeedbackSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackError(null);

    if (!selectedFeatures.length) {
      setFeedbackError("Pick at least one option.");
      return;
    }

    setFeedbackState("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedFeatures,
          message: message.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setFeedbackState("success");
      capture("feedback_submitted", {
        selected_features: selectedFeatures,
        has_message: Boolean(message.trim()),
        has_email: Boolean(email.trim()),
      });
    } catch (err) {
      console.error(err);
      setFeedbackState("error");
      setFeedbackError("Something went wrong. Please try again.");
      capture("feedback_submit_error", {
        selected_features_count: selectedFeatures.length,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-blue-600 p-px shadow-2xl shadow-pink-400/50">
        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          aria-label="Share your ETF exposure"
          title={
            isSharing ? "Preparing your snapshot…" : "Share your exposure card"
          }
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur border border-white/50 shadow-sm hover:bg-white dark:bg-zinc-800/70 dark:hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-wait"
        >
          <AppleShareIcon className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
        </button>

        <div
          ref={cardRef}
          className="flex flex-col gap-4 rounded-3xl bg-white/95 p-5 dark:bg-zinc-900/80"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Powered by WizardFolio • Swipe or tap the dots to explore.
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl border border-zinc-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900 min-h-[320px] flex flex-col justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {isLoading && (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                Crunching your ETF mix…
              </div>
            )}

            {!isLoading && error && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-rose-500 dark:text-rose-400">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    router.refresh();
                  }}
                  className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {slide === 0 && (
                  <ExposureSummary exposure={exposure} showHeader={false} />
                )}

                {slide === 1 && (
                  <RegionExposureChart exposure={exposure} />
                )}

                {slide === 2 && (
                  <HoldingsTable exposure={top10} showHeader={false} />
                )}

                {slide === 3 && (
                  <>
                    {feedbackState === "success" ? (
                      <div className="flex h-full flex-col justify-center rounded-2xl border border-zinc-200 bg-white/80 p-4 text-left text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 sm:text-sm">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">
                          Thank you ✨
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          You’re officially helping design WizardFolio.
                        </h3>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          We’ll use this to decide what to build next. If
                          you left an email, we’ll let you know as new
                          features go live.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleFeedbackSubmit}
                        className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white/80 p-4 text-left text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 sm:text-sm"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">
                          Help shape WizardFolio
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          What would you love to see next?
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Tap a few wishes below. Optional: add your email
                          and we’ll let you know when new features land.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {FEATURE_OPTIONS.map((feature) => {
                            const selected =
                              selectedFeatures.includes(feature);
                            return (
                              <button
                                key={feature}
                                type="button"
                                onClick={() => toggleFeature(feature)}
                                className={[
                                  "rounded-full border px-3 py-1 text-[11px] transition",
                                  selected
                                    ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                                    : "border-zinc-200 bg-white/60 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200",
                                ].join(" ")}
                              >
                                {feature}
                              </button>
                            );
                          })}
                        </div>

                        {hasSomethingElse && (
                          <div className="mt-3">
                            <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                              Something else you wish WizardFolio could do?
                            </label>
                            <textarea
                              value={message}
                              onChange={(e) =>
                                setMessage(e.target.value)
                              }
                              rows={3}
                              className="w-full rounded-xl border border-zinc-200 bg-white/80 p-2 text-xs text-zinc-900 outline-none ring-0 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
                              placeholder="e.g., See all my accounts in one place, more credit card insights, etc."
                            />
                          </div>
                        )}

                        <div className="mt-3">
                          <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                            Email (optional)
                          </label>
                          <input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-xs text-zinc-900 outline-none ring-0 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
                            placeholder="you@example.com"
                          />
                          <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                            Optional. We’ll only email you about WizardFolio
                            updates.
                          </p>
                        </div>

                        {feedbackError && (
                          <p className="mt-2 text-[11px] text-rose-500">
                            {feedbackError}
                          </p>
                        )}
                        {feedbackState === "error" && !feedbackError && (
                          <p className="mt-2 text-[11px] text-rose-500">
                            Something went wrong. Please try again.
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={
                              isSubmittingFeedback ||
                              !selectedFeatures.length
                            }
                            className={[
                              "inline-flex flex-1 items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition",
                              isSubmittingFeedback ||
                              !selectedFeatures.length
                                ? "bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
                            ].join(" ")}
                          >
                            {isSubmittingFeedback
                              ? "Sending..."
                              : "Send my wishlist"}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex justify-center gap-2 pt-1">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlide(idx as 0 | 1 | 2 | 3)}
                className="group"
                aria-label={
                  idx === 0
                    ? "Exposure"
                    : idx === 1
                    ? "Region"
                    : idx === 2
                    ? "Holdings"
                    : "Feedback"
                }
              >
                <span
                  className={[
                    "block h-1.5 w-1.5 rounded-full transition-all",
                    slide === idx
                      ? "w-4 bg-zinc-900 dark:bg-zinc-100"
                      : "bg-zinc-300 dark:bg-zinc-600",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Your mix
          </h3>
          <button
            type="button"
            onClick={handleEditInputs}
            className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            Edit inputs
          </button>
        </div>

        <ul className="divide-y divide-zinc-100 text-xs dark:divide-zinc-800 sm:text-sm">
          {positions.map((pos, idx) => (
            <li
              key={`${pos.symbol}-${idx}`}
              className="flex items-center justify-between py-1.5"
            >
              <span className="font-medium text-zinc-800 dark:text-zinc-100">
                {pos.symbol || "—"}
              </span>
              <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                {(pos.weightPct ?? 0).toFixed(1).replace(/\.0$/, "")}%
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Based on the mix you entered on the previous step.
        </p>
      </section>
    </div>
  );
}
