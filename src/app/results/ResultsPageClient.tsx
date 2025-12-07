"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type TouchEvent,
} from "react";
import BenchmarkComparisonCard from "@/components/BenchmarkComparisonCard";
import ExposureSummary from "@/components/ExposureSummary";
import HoldingsTable from "@/components/HoldingsTable";
import MixLine from "@/components/MixLine";
import { AuthDialog } from "@/components/auth/AuthDialog";
import RegionExposureChart from "@/components/RegionExposureChart";
import { SectorBreakdownCard } from "@/components/SectorBreakdownCard";
import { aggregateHoldingsBySymbol } from "@/lib/exposureAggregations";
import { useRouter } from "next/navigation";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import {
  normalizePositions,
  buildPositionsSearchParams,
} from "@/lib/positionsQuery";
import type { ApiExposureRow, UserPosition } from "@/lib/exposureEngine";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { BENCHMARK_MIXES } from "@/lib/benchmarkPresets";
import {
  compareMixes,
  pickDefaultBenchmark,
  getFallbackBenchmark,
  findBenchmarkBySymbol,
} from "@/lib/benchmarkEngine";
import type { MixComparisonResult } from "@/lib/benchmarkEngine";
import { formatMixSummary } from "@/lib/mixFormatting";
import { getBenchmarkLabel } from "@/lib/benchmarkUtils";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useClipboard } from "@/lib/useClipboard";
import {
  DEFAULT_SAVED_MIX_NAME,
  SAVED_MIX_NAME_ERROR_MESSAGE,
  SAVED_MIX_NAME_MAX_LENGTH,
  SAVED_MIX_NAME_REQUIRED_MESSAGE,
} from "@/lib/savedMixes";

type SlideIndex = 0 | 1 | 2 | 3 | 4;

const SLIDE_TITLES: Record<SlideIndex, string> = {
  0: "Your true exposure",
  1: "By region",
  2: "By sector",
  3: "Top holdings",
  4: "Top loved mixes",
};

const SLIDE_ANALYTICS: Record<SlideIndex, string> = {
  0: "Exposure",
  1: "Region",
  2: "Sector",
  3: "Holdings",
  4: "Top mixes",
};

const TAB_VIEWS: { id: SlideIndex; label: string }[] = [
  { id: 0, label: "Exposure" },
  { id: 1, label: "Regions" },
  { id: 2, label: "Sectors" },
  { id: 3, label: "Holdings" },
  { id: 4, label: "Top mixes" },
];

const DOT_LABELS = TAB_VIEWS.reduce<Record<SlideIndex, string>>((acc, view) => {
  acc[view.id] = view.label;
  return acc;
}, {} as Record<SlideIndex, string>);

const SLIDE_INDICES: SlideIndex[] = [0, 1, 2, 3, 4];

type TopLovedMix = {
  id: string;
  label: string;
  description: string;
  positions: UserPosition[];
};

const TOP_LOVED_MIXES: TopLovedMix[] = [
  {
    id: "us_core_tech_boost",
    label: "🎯 U.S. Core Tech Boost",
    description: "Core U.S. exposure with a tech tilt.",
    positions: [
      { symbol: "VOO", weightPct: 80 },
      { symbol: "QQQ", weightPct: 20 },
    ],
  },
  {
    id: "couch-potato",
    label: "🥔 Couch Potato",
    description: "Simple, balanced Canadian-friendly mix.",
    positions: [
      { symbol: "XEQT.TO", weightPct: 80 },
      { symbol: "VCN.TO", weightPct: 20 },
    ],
  },
  {
    id: "maple-growth-mix",
    label: "🍁 Maple Growth Mix",
    description: "Canada, U.S., and global in 3 ETFs.",
    positions: [
      { symbol: "XEQT.TO", weightPct: 60 },
      { symbol: "VCN.TO", weightPct: 20 },
      { symbol: "VFV.TO", weightPct: 20 },
    ],
  },
  {
    id: "global-three-fund",
    label: "🌍 Global Three-Fund",
    description: "Simple global diversification in one glance.",
    positions: [
      { symbol: "VTI", weightPct: 40 },
      { symbol: "VXUS", weightPct: 30 },
      { symbol: "VT", weightPct: 30 },
    ],
  },
];

type ResultsPageClientProps = {
  initialPositions: UserPosition[];
  positionsQueryString: string;
  hasPositionsParam: boolean;
};

const EMPTY_POSITIONS_ERROR =
  "At least one ETF with a non-empty symbol and positive weight is required";

const mapExposureRowsToMix = (rows: ApiExposureRow[]) =>
  rows
    .map((row) => ({
      ticker: row.holding_symbol,
      weightPct: row.total_weight_pct ?? 0,
    }))
    .filter((entry) => entry.ticker && entry.weightPct > 0);

export default function ResultsPageClient({
  initialPositions,
  positionsQueryString,
  hasPositionsParam,
}: ResultsPageClientProps) {
  const router = useRouter();
  const { capture } = usePostHogSafe();

  const sanitizedPositions = useMemo(
    () => normalizePositions(initialPositions),
    [initialPositions],
  );
  const hasValidPositions = sanitizedPositions.length > 0;
  const positions = hasValidPositions ? sanitizedPositions : initialPositions;
  const positionsCount = sanitizedPositions.length;
  const mixName = useMemo(
    () => formatMixSummary(sanitizedPositions),
    [sanitizedPositions],
  );

  const singleETFSymbol = useMemo(() => {
    if (sanitizedPositions.length !== 1) {
      return null;
    }

    const single = sanitizedPositions[0];
    if (single.weightPct === 100) {
      return single.symbol.trim().toUpperCase();
    }

    return null;
  }, [sanitizedPositions]);

  const defaultBenchmark = useMemo(() => {
    const base = pickDefaultBenchmark(sanitizedPositions);

    if (!singleETFSymbol) {
      return base;
    }

    const baseSymbol =
      base.positions?.[0]?.symbol?.trim().toUpperCase() ??
      base.id.toUpperCase();

    if (baseSymbol === singleETFSymbol) {
      const fallbackSymbol = getFallbackBenchmark(singleETFSymbol);
      const fallbackBenchmark = findBenchmarkBySymbol(fallbackSymbol);
      if (fallbackBenchmark) {
        return fallbackBenchmark;
      }
    }

    return base;
  }, [sanitizedPositions, singleETFSymbol]);

  const user = useSupabaseUser();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState(
    mixName || DEFAULT_SAVED_MIX_NAME,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const trimmedSaveName = saveName.trim();
  const isSaveNameValid = trimmedSaveName.length > 0;

  useEffect(() => {
    if (!showSaveForm) {
      setSaveName(mixName || DEFAULT_SAVED_MIX_NAME);
    }
  }, [mixName, showSaveForm]);

  useEffect(() => {
    if (user && pendingSave) {
      setPendingSave(false);
      setShowSaveForm(true);
      return;
    }

    if (!user) {
      setShowSaveForm(false);
    }
  }, [user, pendingSave]);

  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState(
    defaultBenchmark.id,
  );

  useEffect(() => {
    setSelectedBenchmarkId(defaultBenchmark.id);
  }, [defaultBenchmark.id]);

  const selectedBenchmark = useMemo(
    () =>
      BENCHMARK_MIXES.find((mix) => mix.id === selectedBenchmarkId) ??
      BENCHMARK_MIXES[0],
    [selectedBenchmarkId],
  );

  const benchmarkSymbol =
    selectedBenchmark.positions?.[0]?.symbol ?? selectedBenchmark.id;
  const benchmarkLabel =
    selectedBenchmark.positions?.[0]?.symbol ??
    selectedBenchmark.label ??
    selectedBenchmark.id;

  const handleBenchmarkChange = (newBenchmarkId: string) => {
    const nextBenchmark =
      BENCHMARK_MIXES.find((mix) => mix.id === newBenchmarkId) ??
      selectedBenchmark;
    const nextSymbol =
      nextBenchmark.positions?.[0]?.symbol ?? nextBenchmark.id;
    const nextName = getBenchmarkLabel(nextBenchmark);
    const isDefaultBenchmark = nextBenchmark.id === defaultBenchmark.id;

    capture("benchmark_changed", {
      from_benchmark_symbol: benchmarkSymbol,
      to_benchmark_symbol: nextSymbol,
      from_benchmark_name: benchmarkLabel,
      to_benchmark_name: nextName,
      is_default_benchmark: isDefaultBenchmark,
      source_page: "results",
      mix_name: mixName,
      positions_count: positionsCount,
    });

    setSelectedBenchmarkId(newBenchmarkId);
  };

  const handleSaveClick = () => {
    if (!hasValidPositions) {
      setStatusMessage({
        type: "error",
        message: EMPTY_POSITIONS_ERROR,
      });
      return;
    }

    if (!user) {
      setPendingSave(true);
      setAuthDialogOpen(true);
      return;
    }

    setShowSaveForm(true);
  };

  const handleSaveSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!hasValidPositions || !user) {
      return;
    }

    setStatusMessage(null);
    const trimmedName = saveName.trim();
    if (!trimmedName) {
      setStatusMessage({
        type: "error",
        message: SAVED_MIX_NAME_REQUIRED_MESSAGE,
      });
      return;
    }
    if (trimmedName.length > SAVED_MIX_NAME_MAX_LENGTH) {
      setStatusMessage({
        type: "error",
        message: SAVED_MIX_NAME_ERROR_MESSAGE,
      });
      return;
    }
    setIsSaving(true);

    try {
      const { data: sessionData } =
        await getSupabaseBrowserClient().auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/saved-mixes", {
        method: "POST",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({
          name: trimmedName,
          positions: sanitizedPositions,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.error ?? "Unable to save mix. Please try again.",
        );
      }

      setStatusMessage({
        type: "success",
        message: "Mix saved to your dashboard.",
      });
      setShowSaveForm(false);
      capture("mix_saved", {
        mix_name: trimmedName,
        positions_count: positionsCount,
      });
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        message:
          error?.message ?? "Something went wrong while saving your mix.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingSave) {
      setPendingSave(false);
      setShowSaveForm(true);
    }
  };

  const [exposure, setExposure] = useState<ApiExposureRow[]>([]);
  const [slide, setSlide] = useState<SlideIndex>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userExposureMix = useMemo(
    () => mapExposureRowsToMix(exposure),
    [exposure],
  );

  const [benchmarkComparison, setBenchmarkComparison] =
    useState<MixComparisonResult | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const resultsLoadedRef = useRef(false);
  const { copy, copied } = useClipboard();
  const [shareOrigin, setShareOrigin] = useState<string>(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://wizardfolio.com",
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setShareOrigin(window.location.origin);
    }
  }, []);

  const sharePositionsSearch = useMemo(
    () => buildPositionsSearchParams(sanitizedPositions),
    [sanitizedPositions],
  );
  const shareCardHref = sharePositionsSearch
    ? `/share-card?${sharePositionsSearch}`
    : null;
  const shareResultsUrl = useMemo(() => {
    const base =
      shareOrigin?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://wizardfolio.com";
    const suffix = sharePositionsSearch
      ? `/results?${sharePositionsSearch}`
      : "/results";
    return `${base}${suffix}`;
  }, [shareOrigin, sharePositionsSearch]);

  const top10 = useMemo(() => {
    const aggregated = aggregateHoldingsBySymbol(exposure);
    return aggregated
      .sort(
        (a, b) =>
          (b.total_weight_pct ?? 0) - (a.total_weight_pct ?? 0),
      )
      .slice(0, 10);
  }, [exposure]);

  // Track slide views only when the user actually changes slides
  const trackSlideView = (nextSlide: SlideIndex) => {
    if (!exposure.length) return; // only log once data is ready

    const slideName = SLIDE_ANALYTICS[nextSlide];

    capture("results_slide_viewed", {
      slide_index: nextSlide,
      slide_name: slideName,
      has_exposure: true,
    });
  };

  useEffect(() => {
    if (!sanitizedPositions.length) {
      setExposure([]);
      setError(hasPositionsParam ? EMPTY_POSITIONS_ERROR : null);
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
      } catch (err: any) {
        console.error("Exposure API error:", err);
        setExposure([]);
        const message =
          err?.message || "Something went wrong while analyzing your mix.";

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
  }, [sanitizedPositions, hasPositionsParam, capture]);

  useEffect(() => {
    if (resultsLoadedRef.current) {
      return;
    }

    if (isLoading || !exposure.length) {
      return;
    }

    resultsLoadedRef.current = true;
    capture("results_loaded", {
      holdings_count: exposure.length,
      positions_count: positionsCount,
      benchmark_symbol: benchmarkSymbol,
      mix_name: mixName,
      source_page: "results",
    });
  }, [
    capture,
    exposure.length,
    isLoading,
    positionsCount,
    benchmarkSymbol,
    mixName,
  ]);

  useEffect(() => {
    if (isLoading || !userExposureMix.length || !selectedBenchmark) {
      setBenchmarkComparison(null);
      return;
    }

    const controller = new AbortController();

    const fetchBenchmarkExposure = async () => {
      setIsBenchmarkLoading(true);
      setBenchmarkError(null);

      try {
        const res = await fetch("/api/etf-exposure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positions: selectedBenchmark.positions,
          }),
          signal: controller.signal,
        });

        const body = (await res.json().catch(() => null)) as
          | { exposure?: ApiExposureRow[]; error?: string }
          | null;

        if (!res.ok) {
          throw new Error(body?.error || "Failed to analyze benchmark.");
        }

        const benchmarkRows = body?.exposure ?? [];
        const benchmarkMix = mapExposureRowsToMix(benchmarkRows);
        const comparison = compareMixes(userExposureMix, benchmarkMix);

        if (controller.signal.aborted) return;
        setBenchmarkComparison(comparison);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Benchmark exposure error:", err);
        setBenchmarkError(
          err?.message || "Unable to compare with the selected benchmark.",
        );
        setBenchmarkComparison(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsBenchmarkLoading(false);
        }
      }
    };

    fetchBenchmarkExposure();

    return () => {
      controller.abort();
    };
  }, [isLoading, selectedBenchmark, userExposureMix]);

  const handleEditInputs = () => {
    if (positionsQueryString) {
      router.push(`/?positions=${encodeURIComponent(positionsQueryString)}`);
    } else {
      router.push("/");
    }
  };

  const handleTryTopMix = (mixId: string) => {
    const mix = TOP_LOVED_MIXES.find((m) => m.id === mixId);
    if (!mix) return;

    const positionsParam = buildPositionsSearchParams(mix.positions);

    capture("top_mix_try_clicked", {
      template_key: mix.id,
      source_page: "results",
      source_slide: "top_mixes",
      mix_name: mixName,
      positions_count: positionsCount,
    });

    router.push(`/results?${positionsParam}`);
  };

  const handleShareCardClick = () => {
    if (!shareCardHref) return;

    capture("share_clicked", {
      mix_name: mixName,
      positions_count: positionsCount,
      share_target: "share_card",
      source_card: "true_exposure_card",
    });
  };

  const handleCopyLink = async () => {
    const didCopy = await copy(shareResultsUrl);
    capture("share_clicked", {
      mix_name: mixName,
      positions_count: positionsCount,
      share_target: "copy_link",
      source_card: "true_exposure_card",
      share_success: didCopy,
    });
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) =>
    setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        setSlide((prev) => {
          const next = prev === 4 ? 4 : ((prev + 1) as SlideIndex);
          if (next !== prev) {
            trackSlideView(next);
          }
          return next;
        });
      } else {
        setSlide((prev) => {
          const next = prev === 0 ? 0 : ((prev - 1) as SlideIndex);
          if (next !== prev) {
            trackSlideView(next);
          }
          return next;
        });
      }
    }

    setTouchStartX(null);
  };

  const cycleSlide = (direction: 1 | -1) => {
    setSlide((prev) => {
      const currentIndex = SLIDE_INDICES.indexOf(prev);
      const nextIndex =
        (currentIndex + direction + SLIDE_INDICES.length) %
        SLIDE_INDICES.length;
      const nextSlide = SLIDE_INDICES[nextIndex];

      if (nextSlide !== prev) {
        trackSlideView(nextSlide);
      }

      return nextSlide;
    });
  };

  const handlePrevSlide = () => cycleSlide(-1);
  const handleNextSlide = () => cycleSlide(1);

  const title = SLIDE_TITLES[slide];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-3 hidden items-center justify-between gap-3 text-sm md:flex">
          <div className="flex flex-wrap items-center gap-2">
            {TAB_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => {
                  if (view.id === slide) return;
                  setSlide(view.id);
                  trackSlideView(view.id);
                }}
                className={[
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  view.id === slide
                    ? "bg-neutral-900 text-white"
                    : "bg-transparent text-neutral-600 hover:bg-neutral-100",
                ].join(" ")}
              >
                {view.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Previous result view"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Next result view"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-50"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <div className="relative rounded-3xl border border-neutral-200 bg-white shadow-sm">
          {shareCardHref && (
            <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2 sm:flex-row">
              <a
                href={shareCardHref}
                target="_blank"
                rel="noreferrer noopener"
                onClick={handleShareCardClick}
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                Share card
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white/90 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-300"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4 rounded-3xl bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-neutral-900">
                  {title}
                </h2>
                <MixLine positions={sanitizedPositions} />
                <p className="text-xs text-neutral-500">
                  Powered by WizardFolio
                </p>
              </div>
            </div>

            <div
              className="flex min-h-[320px] flex-col justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {isLoading && (
                <div className="flex h-full items-center justify-center text-sm text-neutral-700">
                  Crunching your ETF mix…
                </div>
              )}

              {!isLoading && error && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-rose-500">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      router.refresh();
                    }}
                    className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-white"
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

                  {slide === 1 && <RegionExposureChart exposure={exposure} />}

                  {slide === 2 && <SectorBreakdownCard exposure={exposure} />}

                  {slide === 3 && (
                    <HoldingsTable exposure={top10} showHeader={false} />
                  )}

                  {slide === 4 && (
                    <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 text-left text-xs shadow-sm sm:text-sm">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                        Top loved mixes
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-neutral-900">
                        Tap a mix below to load it into WizardFolio.
                      </h3>

                      <div className="mt-3 space-y-2">
                        {TOP_LOVED_MIXES.map((mix) => (
                          <button
                            key={mix.id}
                            type="button"
                            onClick={() => handleTryTopMix(mix.id)}
                            className="group flex w-full flex-col items-start rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-sm"
                          >
                            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-900">
                              {mix.label}
                              <span className="text-[11px] text-neutral-400 transition-transform group-hover:translate-x-0.5">
                                ›
                              </span>
                            </span>
                            <span className="mt-0.5 text-[11px] text-neutral-500">
                              {mix.description}
                            </span>
                          </button>
                        ))}
                      </div>

                      <p className="mt-3 text-[11px] text-neutral-500">
                        We’ll reload WizardFolio with your chosen mix prefilled so you can see its
                        true exposure in one tap.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-3 md:hidden">
            {SLIDE_INDICES.map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (idx === slide) return;
                  setSlide(idx);
                  trackSlideView(idx);
                }}
                className="group"
                aria-label={DOT_LABELS[idx]}
              >
                <span
                  className={[
                    "block h-1.5 rounded-full transition-all",
                    slide === idx
                      ? "w-4 bg-neutral-900"
                      : "w-1.5 bg-neutral-300",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
        </div>
    </div>

    {hasValidPositions && (
      <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm transition hover:shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
              Personalization
            </p>
            <h3 className="text-base font-semibold text-neutral-900">
              Save this mix to your dashboard
            </h3>
          </div>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="rounded-full border border-transparent bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            Save this mix
          </button>
        </div>

        {showSaveForm && (
          <form onSubmit={handleSaveSubmit} className="mt-4 space-y-3">
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
              Mix name
              <input
                type="text"
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                placeholder="My saved mix"
                maxLength={SAVED_MIX_NAME_MAX_LENGTH}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={!isSaveNameValid || isSaving}
                className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save mix"}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {statusMessage && (
          <p
            className={`mt-3 text-sm ${
              statusMessage.type === "success"
                ? "text-emerald-600"
                : "text-rose-500"
            }`}
          >
            {statusMessage.message}
          </p>
        )}
      </section>
    )}

    {hasValidPositions && (
      <BenchmarkComparisonCard
        userLabel="Your mix"
        benchmark={selectedBenchmark}
        comparison={benchmarkComparison}
        benchmarks={BENCHMARK_MIXES}
        onBenchmarkChange={handleBenchmarkChange}
        exposure={exposure}
        userExposureMix={userExposureMix}
        singleSymbol={singleETFSymbol}
        mixName={mixName}
        positionsCount={positionsCount}
        benchmarkSymbol={benchmarkSymbol}
        hasBenchmarkComparison={Boolean(benchmarkComparison)}
      />
    )}

      <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">
            Your mix
          </h3>
          <button
            type="button"
            onClick={handleEditInputs}
            className="text-sm font-medium text-neutral-700 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Edit inputs
          </button>
        </div>

        <ul className="divide-y divide-neutral-100 text-sm">
          {positions.map((pos, idx) => (
            <li
              key={`${pos.symbol}-${idx}`}
              className="flex items-center justify-between py-1.5"
            >
              <span className="font-medium text-neutral-900">
                {pos.symbol || "—"}
              </span>
              <span className="tabular-nums text-neutral-700">
                {(pos.weightPct ?? 0).toFixed(1).replace(/\.0$/, "")}%
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-[11px] text-neutral-500">
          Based on the mix you entered on the previous step.
        </p>
      </section>
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
