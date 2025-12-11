"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import BenchmarkComparisonCard from "@/components/BenchmarkComparisonCard";
import ExposureSummary from "@/components/ExposureSummary";
import HoldingsTable from "@/components/HoldingsTable";
import MixLine from "@/components/MixLine";
import { AuthDialog } from "@/components/auth/AuthDialog";
import PortfolioInput from "@/components/PortfolioInput";
import RegionExposureChart from "@/components/RegionExposureChart";
import { SectorBreakdownCard } from "@/components/SectorBreakdownCard";
import { aggregateHoldingsBySymbol } from "@/lib/exposureAggregations";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { AppleShareIcon } from "@/components/icons/AppleShareIcon";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import {
  normalizePositions,
  buildPositionsSearchParams,
} from "@/lib/positionsQuery";
import type { ApiExposureRow, UserPosition } from "@/lib/exposureEngine";
import { useImageShare } from "@/hooks/useImageShare";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { BENCHMARK_MIXES, type BenchmarkMix } from "@/lib/benchmarkPresets";
import { TopLovedMixes } from "@/components/TopLovedMixes";
import { type Template } from "@/lib/quickStartTemplates";
import {
  compareMixes,
  pickDefaultBenchmark,
  getFallbackBenchmark,
  findBenchmarkBySymbol,
} from "@/lib/benchmarkEngine";
import type { MixComparisonResult } from "@/lib/benchmarkEngine";
import { formatMixSummary } from "@/lib/mixFormatting";
import { getBenchmarkLabel } from "@/lib/benchmarkUtils";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getAnonId } from "@/lib/analytics/anonId";
import { snapshotPreviousMix } from "@/lib/previousMixSnapshot";
import SaveMixCta from "./SaveMixCta";
import {
  useRecentMixes,
  type RecentMix,
} from "@/hooks/useRecentMixes";
import RecentMixesChips from "@/components/results/RecentMixesChips";

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

const DOT_LABELS = TAB_VIEWS.reduce<Record<SlideIndex, string>>(
  (acc, view) => {
    acc[view.id] = view.label;
    return acc;
  },
  {} as Record<SlideIndex, string>,
);

const SLIDE_INDICES: SlideIndex[] = [0, 1, 2, 3, 4];

const COMPARE_UPSELL_STORAGE_KEY = "wizardfolio_compare_upsell_seen_v1";

type CompareTarget =
  | { type: "benchmark"; benchmarkId: string }
  | { type: "previous"; mix: RecentMix };

type CompareOptionsPanelProps = {
  chipClassName: string;
  benchmarks: BenchmarkMix[];
  activeTarget: CompareTarget;
  recentMixes: RecentMix[];
  isAuthenticated: boolean;
  onBenchmarkSelect: (benchmarkId: string) => void;
  onCompareWithMix: (mix: RecentMix) => void;
  onSignInClick: () => void;
  showUpsell?: boolean;
};

function CompareOptionsPanel({
  chipClassName,
  benchmarks,
  activeTarget,
  recentMixes,
  isAuthenticated,
  onBenchmarkSelect,
  onCompareWithMix,
  onSignInClick,
  showUpsell,
}: CompareOptionsPanelProps) {
  const getChipClass = (isActive: boolean) =>
    isActive
      ? `${chipClassName} border-neutral-900 bg-neutral-100 text-neutral-900`
      : chipClassName;

  const activePreviousMixId =
    activeTarget.type === "previous" ? activeTarget.mix.id : null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Compare with
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Benchmarks
          </p>
          <div className="flex flex-wrap gap-2">
            {benchmarks.map((benchmark) => (
              <button
                key={benchmark.id}
                type="button"
                className={getChipClass(
                  activeTarget.type === "benchmark" &&
                    activeTarget.benchmarkId === benchmark.id,
                )}
                onClick={() => onBenchmarkSelect(benchmark.id)}
              >
                {getBenchmarkLabel(benchmark)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Your previous mixes
          </p>

          {recentMixes.length === 0 ? (
            <p className="text-xs text-neutral-500">
              You don't have any previous mixes yet. Adjust the ETFs above and
              we'll remember them here for quick comparisons.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {recentMixes.map((mix) => (
                  <button
                    key={mix.id}
                    type="button"
                    className={getChipClass(activePreviousMixId === mix.id)}
                    onClick={() => onCompareWithMix(mix)}
                  >
                    {formatMixSummary(mix.positions)}
                  </button>
                ))}
              </div>

              {showUpsell && !isAuthenticated && (
                <div className="mt-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                  <p className="font-medium">Enjoying the compare view?</p>
                  <p className="mt-0.5">
                    Create a free account to keep your favourite mixes in one
                    place and compare them anytime.
                  </p>
                  <button
                    type="button"
                    onClick={onSignInClick}
                    className="mt-2 inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-neutral-800"
                  >
                    Create free account
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type ResultsPageClientProps = {
  initialPositions: UserPosition[];
  hasPositionsParam: boolean;
  topLoved?: Template[];
};

const EMPTY_POSITIONS_ERROR =
  "At least one ETF with a non-empty symbol and positive weight is required";

const mapExposureRowsToMix = (rows: ApiExposureRow[]) => {
  const byTicker = new Map<string, number>();

  for (const row of rows) {
    const rawSymbol = (row as any).holding_symbol ?? "";
    const symbol = String(rawSymbol).trim().toUpperCase();
    if (!symbol) continue;

    const rawWeight = (row as any).total_weight_pct ?? 0;
    const weight = typeof rawWeight === "string" ? Number(rawWeight) : rawWeight;
    if (!Number.isFinite(weight) || weight <= 0) continue;

    byTicker.set(symbol, (byTicker.get(symbol) ?? 0) + weight);
  }

  return Array.from(byTicker.entries()).map(([ticker, weightPct]) => ({
    ticker,
    weightPct,
  }));
};

export default function ResultsPageClient({
  initialPositions,
  hasPositionsParam,
  topLoved = [],
}: ResultsPageClientProps) {
  const router = useRouter();
  const { capture } = usePostHogSafe();
  const { recentMixes, addLocalMix, addLocalMixSnapshot } = useRecentMixes();

  const [positions, setPositions] = useState<UserPosition[]>(initialPositions);
  const [hasSaved, setHasSaved] = useState(false);
  const [hasInteractedWithMix, setHasInteractedWithMix] = useState(false);
  const [anonId, setAnonId] = useState<string | null>(null);
  const initialMixSource = hasPositionsParam ? "url" : "scratch";
  const [mixSource, setMixSource] = useState<"scratch" | "template" | "url">(
    initialMixSource,
  );
  const [mixTemplateKey, setMixTemplateKey] = useState<string | null>(null);

  const validPositions = useMemo(
    () =>
      positions.filter(
        (p) => p.symbol.trim() !== "" && (p.weightPct ?? 0) > 0,
      ),
    [positions],
  );

  const normalizedPositions = useMemo(
    () => normalizePositions(validPositions),
    [validPositions],
  );

  const positionsCount = normalizedPositions.length;
  const hasValidPositions = positionsCount > 0;

  const [isInputCollapsed, setIsInputCollapsed] = useState(
    () => hasPositionsParam && hasValidPositions,
  );

  const totalWeight = useMemo(
    () =>
      validPositions.reduce(
        (acc, p) => acc + (p.weightPct ?? 0),
        0,
      ),
    [validPositions],
  );

  const mixName = useMemo(
    () => formatMixSummary(normalizedPositions),
    [normalizedPositions],
  );

  const mixSummaryLine = useMemo(() => {
    if (!normalizedPositions.length) return "No ETFs yet.";

    const parts = normalizedPositions.slice(0, 3).map((pos) => {
      const symbol = pos.symbol.trim().toUpperCase();
      const pct = Math.round(pos.weightPct ?? 0);
      return `${symbol} ${pct}%`;
    });

    const remainingCount = normalizedPositions.length - parts.length;
    if (remainingCount > 0) {
      parts.push(`+ ${remainingCount} more`);
    }

    return parts.join(" · ");
  }, [normalizedPositions]);

  const singleETFSymbol = useMemo(() => {
    if (normalizedPositions.length !== 1) {
      return null;
    }

    const single = normalizedPositions[0];
    if (single.weightPct === 100) {
      return single.symbol.trim().toUpperCase();
    }

    return null;
  }, [normalizedPositions]);

  const defaultBenchmark = useMemo(() => {
    const base = pickDefaultBenchmark(normalizedPositions);

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
  }, [normalizedPositions, singleETFSymbol]);

  const user = useSupabaseUser();
  const isAuthenticated = Boolean(user);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareCount, setCompareCount] = useState(0);
  const [hasShownCompareUpsell, setHasShownCompareUpsell] = useState(false);
  const [compareTarget, setCompareTarget] = useState<CompareTarget>({
    type: "benchmark",
    benchmarkId: defaultBenchmark.id,
  });
  const [compareTargetExposure, setCompareTargetExposure] =
    useState<ApiExposureRow[] | null>(null);

  useEffect(() => {
    setCompareTarget((current) =>
      current.type === "benchmark"
        ? current.benchmarkId === defaultBenchmark.id
          ? current
          : { type: "benchmark", benchmarkId: defaultBenchmark.id }
        : current,
    );
  }, [defaultBenchmark.id]);

  // Track arrivals to results page
  useEffect(() => {
    capture("results_page_viewed", {
      positions_count: positionsCount,
      has_positions_param: hasPositionsParam,
      total_weight: totalWeight,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = getAnonId();
    if (id) {
      setAnonId(id);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(
      COMPARE_UPSELL_STORAGE_KEY,
    );
    if (seen === "true") {
      setHasShownCompareUpsell(true);
    }
  }, []);

  const selectedBenchmark = useMemo(() => {
    const activeId =
      compareTarget.type === "benchmark"
        ? compareTarget.benchmarkId
        : defaultBenchmark.id;

    return (
      BENCHMARK_MIXES.find((mix) => mix.id === activeId) ?? defaultBenchmark
    );
  }, [compareTarget, defaultBenchmark]);

  useEffect(() => {
    const searchParams = buildPositionsSearchParams(normalizedPositions);
    const nextUrl = searchParams ? `/results?${searchParams}` : "/results";
    window.history.replaceState(null, "", nextUrl);
  }, [normalizedPositions]);

  const benchmarkSymbol =
    compareTarget.type === "benchmark"
      ? selectedBenchmark.positions?.[0]?.symbol ?? selectedBenchmark.id
      : "previous_mix";
  const benchmarkLabel =
    compareTarget.type === "benchmark"
      ? getBenchmarkLabel(selectedBenchmark)
      : "Previous mix";

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
      benchmark_source: compareTarget.type,
    });

    setCompareTarget({ type: "benchmark", benchmarkId: newBenchmarkId });
    setCompareTargetExposure(null);
  };

  // Helper to centralize PostHog props for save actions
  const baseSaveProps = {
    source_page: "results" as const,
    mix_name: mixName,
    positions_count: positionsCount,
    has_user: Boolean(user),
    has_valid_positions: hasValidPositions,
  };

  const saveMix = async (source: "cta" | "auth") => {
    if (!hasValidPositions || !user) return;

    setStatusMessage(null);
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
          // Let backend handle fallback naming if mixName is empty
          name: mixName || undefined,
          positions: normalizedPositions,
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
      setHasSaved(true);

      addLocalMix(positions);

      capture("recent_mix_added_local", {
        positions_count: positions.length,
      });

      capture("results_save_success", {
        positions_count: positionsCount,
      });

      capture("mix_saved", {
        mix_name: mixName,
        positions_count: positionsCount,
        source_page: "results",
        source,
      });
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        message:
          error?.message ?? "Something went wrong while saving your mix.",
      });

      capture("results_save_error", {
        error_message: String(error?.message || "unknown"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    capture("save_this_mix_clicked", baseSaveProps);

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

    // User is logged in → save immediately
    void saveMix("cta");
  };

  const handleAuthSuccess = () => {
    if (!pendingSave) return;

    setPendingSave(false);
    setAuthDialogOpen(false);

    // After successful auth from this CTA, auto-save
    void saveMix("auth");
  };

  const handleCompareClick = () => {
    setIsCompareMode((prev) => !prev);
  };

  const handleCompareUpsellSignIn = () => {
    setAuthDialogOpen(true);
    capture("compare_upsell_signin_clicked", {
      source_page: "results",
    });
  };

  const handleCompareWithPreviousMix = (mix: RecentMix) => {
    capture("compare_with_previous_mix", {
      mix_id: mix.id,
      source_page: "results",
      is_authenticated: Boolean(user),
      compare_count_before: compareCount,
      compare_target_summary: formatMixSummary(mix.positions),
    });

    const nextCount = compareCount + 1;
    setCompareCount(nextCount);

    setCompareTarget({ type: "previous", mix });
    setCompareTargetExposure(null);

    if (!user && !hasShownCompareUpsell && nextCount >= 1) {
      setHasShownCompareUpsell(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(COMPARE_UPSELL_STORAGE_KEY, "true");
      }
      capture("compare_upsell_shown", {
        source_page: "results",
        trigger: "previous_mix_compare",
      });
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
  const cardRef = useRef<HTMLDivElement | null>(null);
  const resultsLoadedRef = useRef(false);
  const { shareElementAsImage, isSharing } = useImageShare();
  const exposureLoadedRef = useRef(false);
  const initialSnapshotRef = useRef(false);

  const top10 = useMemo(() => {
    const aggregated = aggregateHoldingsBySymbol(exposure);
    return aggregated
      .sort(
        (a, b) =>
          (b.total_weight_pct ?? 0) - (a.total_weight_pct ?? 0),
      )
      .slice(0, 10);
  }, [exposure]);

  const trackSlideView = (nextSlide: SlideIndex) => {
    if (!exposure.length) return;

    const slideName = SLIDE_ANALYTICS[nextSlide];

    capture("results_slide_viewed", {
      slide_index: nextSlide,
      slide_name: slideName,
      has_exposure: Boolean(exposure.length),
      positions_count: positionsCount,
    });
  };

  useEffect(() => {
    if (!hasValidPositions) {
      setExposure([]);
      setError(hasPositionsParam ? EMPTY_POSITIONS_ERROR : null);
      setIsLoading(false);
      setSlide(0);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/etf-exposure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positions: normalizedPositions }),
          signal: controller.signal,
        });

        const body = (await res.json().catch(() => null)) as
          | { exposure?: ApiExposureRow[]; error?: string }
          | null;

        if (!res.ok) {
          throw new Error(body?.error || "Failed to analyze portfolio.");
        }

        if (controller.signal.aborted) return;

        const holdings = body?.exposure ?? [];

        setExposure(holdings);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Exposure API error:", err);
        setExposure([]);
        const message =
          err?.message || "Something went wrong while analyzing your mix.";

        setError(message);

        capture("exposure_error", {
          error_message: String(message).slice(0, 200),
          num_etfs: normalizedPositions.length,
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setSlide(0);
        }
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [hasValidPositions, normalizedPositions, hasPositionsParam, capture]);

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
    if (isLoading || !userExposureMix.length) {
      setBenchmarkComparison(null);
      setCompareTargetExposure(null);
      return;
    }

    const controller = new AbortController();
    const targetBenchmark =
      compareTarget.type === "benchmark"
        ? BENCHMARK_MIXES.find((mix) => mix.id === compareTarget.benchmarkId) ??
          defaultBenchmark
        : null;
    const targetPositions =
      compareTarget.type === "benchmark"
        ? targetBenchmark?.positions ?? []
        : compareTarget.mix.positions ?? [];

    if (!targetPositions.length) {
      setBenchmarkComparison(null);
      setCompareTargetExposure(null);
      setBenchmarkError("Comparison mix is empty.");
      setIsBenchmarkLoading(false);
      return;
    }

    const benchmarkSource = compareTarget.type;
    const benchmarkSymbolForEvent =
      benchmarkSource === "benchmark"
        ? targetBenchmark?.positions?.[0]?.symbol ??
          targetBenchmark?.id ??
          "benchmark"
        : "previous_mix";

    const fetchBenchmarkExposure = async () => {
      setIsBenchmarkLoading(true);
      setBenchmarkError(null);

      try {
        const res = await fetch("/api/etf-exposure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positions: targetPositions,
          }),
          signal: controller.signal,
        });

        const body = (await res.json().catch(() => null)) as
          | { exposure?: ApiExposureRow[]; error?: string }
          | null;

        if (!res.ok) {
          throw new Error(body?.error || "Failed to analyze comparison mix.");
        }

        const benchmarkRows = body?.exposure ?? [];
        const benchmarkMix = mapExposureRowsToMix(benchmarkRows);
        const comparison = compareMixes(userExposureMix, benchmarkMix);

        if (controller.signal.aborted) return;
        setBenchmarkComparison(comparison);
        setCompareTargetExposure(benchmarkRows);

        capture("results_benchmark_loaded", {
          benchmark_symbol: benchmarkSymbolForEvent,
          benchmark_source: benchmarkSource,
          user_positions_count: positionsCount,
        });
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Benchmark exposure error:", err);
        setBenchmarkError(
          err?.message || "Unable to compare with the selected mix.",
        );
        setBenchmarkComparison(null);
        setCompareTargetExposure(null);

        capture("results_benchmark_error", {
          error_message: String(err?.message || "unknown"),
          benchmark_symbol: benchmarkSymbolForEvent,
          benchmark_source: benchmarkSource,
        });
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
  }, [
    isLoading,
    userExposureMix,
    compareTarget,
    capture,
    positionsCount,
    defaultBenchmark,
  ]);

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    try {
      capture("results_share_clicked", {
        mix_name: mixName,
        positions_count: positionsCount,
        share_target: "image",
        source_card: "true_exposure_card",
      });

      await shareElementAsImage(cardRef.current, {
        fileName: "wizardfolio-exposure.png",
        title: "WizardFolio ETF exposure",
        text: "ETF look-through powered by WizardFolio (wizardfolio.com)",
      });

      capture("results_share_success", {
        positions_count: positionsCount,
      });
    } catch (error: any) {
      capture("results_share_error", {
        error_message: String(error?.message || "unknown"),
      });
    }
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
  const totalIsHundred = Math.abs(totalWeight - 100) < 0.0001;
  const helperText = hasValidPositions
    ? totalIsHundred
      ? "Nice -- you're at 100%. Results are shown exactly as entered."
      : `Your mix totals ${Math.round(
          totalWeight,
        )}%. Results are shown proportionally.`
    : "Add ETFs to see your breakdown.";
  const hasExposure = exposure.length > 0;
  const shouldShowSaveCta =
    hasValidPositions &&
    hasExposure &&
    (hasInteractedWithMix || hasPositionsParam);
  const compareChipClass =
    "inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50";
  const showCompareUpsell = !isAuthenticated && hasShownCompareUpsell;
  const renderComparePanel = () => (
    <CompareOptionsPanel
      chipClassName={compareChipClass}
      benchmarks={BENCHMARK_MIXES}
      activeTarget={compareTarget}
      recentMixes={recentMixes}
      isAuthenticated={isAuthenticated}
      onBenchmarkSelect={handleBenchmarkChange}
      onCompareWithMix={handleCompareWithPreviousMix}
      onSignInClick={handleCompareUpsellSignIn}
      showUpsell={showCompareUpsell}
    />
  );

  // Fire once when exposure data is available
  useEffect(() => {
    if (exposureLoadedRef.current) return;
    if (!hasExposure || isLoading || error) return;

    exposureLoadedRef.current = true;
    capture("results_exposure_loaded", {
      holdings_count: exposure.length,
      positions_count: positionsCount,
    });
  }, [capture, error, exposure.length, hasExposure, isLoading, positionsCount]);

  const isRoughlyComplete = (total: number) => total >= 99 && total <= 101;

  // Helper: canonicalize positions and check if this mix already exists in recentMixes
  const normalizeForComparison = useCallback(
    (positionsToNormalize: UserPosition[]) => {
      const valid = positionsToNormalize.filter(
        (p) => p.symbol.trim() !== "" && (p.weightPct ?? 0) > 0,
      );
      const normalized = normalizePositions(valid);
      return normalized.map((p) => ({
        symbol: p.symbol.trim().toUpperCase(),
        weight: Math.round((p.weightPct ?? 0) * 1000) / 1000,
      }));
    },
    [],
  );

  const isDuplicateMix = useCallback(
    (positionsToCheck: UserPosition[]) => {
      if (!recentMixes.length) return false;

      const target = normalizeForComparison(positionsToCheck);
      if (!target.length) return false;

      return recentMixes.some((mix) => {
        const candidate = normalizeForComparison(mix.positions);
        if (candidate.length !== target.length) return false;

        for (let i = 0; i < candidate.length; i += 1) {
          if (
            candidate[i].symbol !== target[i].symbol ||
            Math.abs(candidate[i].weight - target[i].weight) > 0.001
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [recentMixes, normalizeForComparison],
  );

  // Initial snapshot (first time on results with a complete mix)
  useEffect(() => {
    if (initialSnapshotRef.current) return;
    if (!anonId) return;

    const total = initialPositions.reduce(
      (acc, p) => acc + (p.weightPct ?? 0),
      0,
    );

    const normalizedInitial = normalizePositions(initialPositions);

    if (!normalizedInitial.length || !isRoughlyComplete(total)) return;

    // 🚫 Avoid snapshot if this exact mix is already in chips
    if (isDuplicateMix(initialPositions)) return;

    initialSnapshotRef.current = true;

    void snapshotPreviousMix(
      normalizedInitial,
      {
        source: initialMixSource,
        templateKey: mixTemplateKey,
        benchmarkSymbol: benchmarkSymbol ?? null,
        anonId,
        userId: user?.id ?? null,
      },
      addLocalMixSnapshot,
    );
  }, [
    initialPositions,
    anonId,
    initialMixSource,
    mixTemplateKey,
    benchmarkSymbol,
    user?.id,
    addLocalMixSnapshot,
    isDuplicateMix,
  ]);

  // Snapshot when user lands on a new complete mix (after edits / chips / templates)
  useEffect(() => {
    if (!anonId) return;
    if (!normalizedPositions.length) return;
    if (!isRoughlyComplete(totalWeight)) return;

    // 🚫 Avoid snapshot if this exact mix is already in chips
    if (isDuplicateMix(normalizedPositions)) return;

    const timer = window.setTimeout(() => {
      void snapshotPreviousMix(
        normalizedPositions,
        {
          source: mixSource,
          templateKey: mixTemplateKey,
          benchmarkSymbol: benchmarkSymbol ?? null,
          anonId,
          userId: user?.id ?? null,
        },
        addLocalMixSnapshot,
      );
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [
    normalizedPositions,
    totalWeight,
    anonId,
    mixSource,
    mixTemplateKey,
    benchmarkSymbol,
    user?.id,
    addLocalMixSnapshot,
    isDuplicateMix,
  ]);

  const handlePositionsChange = (
    next: UserPosition[],
    meta?: {
      source?: "scratch" | "template" | "url";
      templateKey?: string | null;
    },
  ) => {
    const nextValid = next.filter(
      (p) => p.symbol.trim() !== "" && (p.weightPct ?? 0) > 0,
    );
    const nextNormalized = normalizePositions(nextValid);
    const nextCount = nextNormalized.length;
    const nextTotalWeight = nextValid.reduce(
      (acc, p) => acc + (p.weightPct ?? 0),
      0,
    );

    setPositions(next);

    // Reset saved state
    setHasSaved(false);

    // Reset inline success/error messages
    setStatusMessage(null);

    setMixSource(meta?.source ?? "scratch");
    setMixTemplateKey(meta?.templateKey ?? null);

    if (!hasInteractedWithMix) {
      setHasInteractedWithMix(true);
    }

    // Track any edit to the mix (weights, add/remove)
    capture("results_mix_edited", {
      positions_count: nextCount,
      total_weight: nextTotalWeight,
      source_page: "results",
    });
  };

  const handleExpandInput = () => {
    capture("results_input_expanded_manual", {
      source_page: "results",
      positions_count: positionsCount,
    });

    if (!hasInteractedWithMix) {
      capture("results_input_expanded", {
        source_page: "results",
        has_positions_param: hasPositionsParam,
        positions_count: positionsCount,
      });
      setHasInteractedWithMix(true);
    }

    setIsInputCollapsed(false);
  };

  const handleCollapseInput = () => {
    capture("results_input_collapsed", {
      source_page: "results",
      positions_count: positionsCount,
    });

    setIsInputCollapsed(true);
  };

  const handleSelectRecentMix = (mix: RecentMix) => {
    setPositions(mix.positions);
    setHasInteractedWithMix(true);
    setMixSource("scratch");
    setMixTemplateKey(null);
    setIsInputCollapsed(false);
    capture("recent_mix_loaded_from_chip", {
      mix_id: mix.id,
      source: mix.source,
    });
  };

  return (
    <>
      <div className="space-y-5 md:space-y-6">
        {isInputCollapsed ? (
          <section className="flex flex-col gap-2 rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <h2 className="text-base font-semibold text-neutral-900">
                  Your mix
                </h2>
                <p className="mt-1 text-xs font-medium text-neutral-800">
                  {mixSummaryLine}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExpandInput}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                Edit mix
              </button>
            </div>
          </section>
        ) : (
          <section className="relative rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-neutral-700">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white">
                i
              </span>
              <span>
                Edit ETF weights or tickers below to see exposure update
                instantly.
              </span>
            </div>
            {hasValidPositions && (
              <button
                type="button"
                onClick={handleCollapseInput}
                aria-label="Collapse mix input"
                title="Collapse mix input"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            )}
            <PortfolioInput
              positions={positions}
              onChange={handlePositionsChange}
              onAnalyze={() => {}}
              analyzeLabel="Update exposure"
              hideAnalyzeButton
              chipsSlot={
                <RecentMixesChips
                  recentMixes={recentMixes}
                  isAuthenticated={isAuthenticated}
                  onSelectMix={handleSelectRecentMix}
                  onSignInClick={() => {
                    setAuthDialogOpen(true);
                    capture("recent_mix_signin_chip_navigate", {});
                  }}
                  showTitle={false}
                  maxChips={3}
                  className="mb-3"
                />
              }
            />

            <p className="mt-3 text-xs text-neutral-600">{helperText}</p>
          </section>
        )}

        {isCompareMode && (
          <div className="hidden md:block md:pt-2">
            {renderComparePanel()}
          </div>
        )}

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
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    slide === view.id
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                  ].join(" ")}
                >
                  {view.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="hidden md:inline">
                View:{" "}
                <span className="font-medium text-neutral-800">
                  {SLIDE_TITLES[slide]}
                </span>
              </span>
              <div className="flex items-center gap-1">
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
          </div>

          <div className="relative rounded-3xl border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              aria-label="Share your ETF exposure"
              title={
                isSharing
                  ? "Preparing your snapshot…"
                  : "Share your exposure card"
              }
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60"
            >
              <AppleShareIcon className="h-4 w-4 text-neutral-700" />
            </button>

            <div
              ref={cardRef}
              className="flex flex-col gap-4 rounded-3xl bg-white p-5 md:p-6 lg:p-8"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold text-neutral-900">
                    {title}
                  </h2>
                  <MixLine positions={normalizedPositions} />
                  <p className="text-[11px] text-neutral-500">
                    Powered by WizardFolio
                  </p>
                </div>
              </div>

              <div
                className="flex min-h-[320px] flex-col justify-center rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {isLoading && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-neutral-700">
                    <div className="h-24 w-24 animate-pulse rounded-full bg-neutral-100" />
                    <div className="h-3 w-32 animate-pulse rounded-full bg-neutral-100" />
                    <p>Crunching your ETF mix…</p>
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

                {!isLoading && !error && !hasExposure && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-neutral-700">
                    <p>Adjust your ETFs above to see the breakdown.</p>
                  </div>
                )}

                {!isLoading && !error && hasExposure && (
                  <>
                    {slide === 0 && (
                      <ExposureSummary
                        exposure={exposure}
                        showHeader={false}
                      />
                    )}

                    {slide === 1 && (
                      <RegionExposureChart
                        exposure={exposure}
                        variant="bare"
                      />
                    )}

                    {slide === 2 && (
                      <SectorBreakdownCard
                        exposure={exposure}
                        variant="bare"
                      />
                    )}

                    {slide === 3 && (
                      <HoldingsTable
                        exposure={top10}
                        showHeader={false}
                        variant="bare"
                      />
                    )}

                    {slide === 4 && (
                      <TopLovedMixes
                        mixes={topLoved}
                        onSelect={(nextPositions, template) => {
                          const positionsParam =
                            buildPositionsSearchParams(nextPositions);

                          handlePositionsChange(nextPositions, {
                            source: "template",
                            templateKey: template.id,
                          });

                          capture("top_mix_try_clicked", {
                            template_key: template.id,
                            source_page: "results",
                            source_slide: "top_mixes",
                            mix_name: mixName,
                            positions_count: positionsCount,
                          });

                          const nextUrl = positionsParam
                            ? `/results?${positionsParam}`
                            : "/results";
                          window.history.replaceState(null, "", nextUrl);
                        }}
                      />
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
                        : "w-1.5 bg-neutral-300 group-hover:bg-neutral-400",
                    ].join(" ")}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {isCompareMode && (
          <div className="mt-4 border-t border-neutral-100 pt-4 md:hidden">
            {renderComparePanel()}
          </div>
        )}

        {shouldShowSaveCta && (
          <SaveMixCta
            onSaveClick={handleSaveClick}
            onCompareClick={handleCompareClick}
            isSaving={isSaving}
            hasSaved={hasSaved}
            statusMessage={statusMessage}
          />
        )}

        {isCompareMode && hasValidPositions && (
          <p className="mt-4 mb-2 text-[11px] text-neutral-500">
            Compare your current mix with benchmarks or your previous mixes
            below.
          </p>
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
            compareTarget={compareTarget}
            benchmarkError={benchmarkError}
            isBenchmarkLoading={isBenchmarkLoading}
            targetExposure={compareTargetExposure ?? []}
          />
        )}

        {/* Friendly orientation section (subtle helper style) */}
        <section className="mt-4 space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-[11px] text-neutral-600 shadow-sm">
          <p className="font-medium text-neutral-800">
            What you can do here
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Adjust ETFs above and watch everything update in real time.</li>
            <li>Save this mix to your dashboard to revisit later.</li>
            <li>Compare your mix with benchmarks using the tabs above.</li>
            <li>Try a popular template in “Top mixes”.</li>
          </ul>
        </section>

        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    </>
  );
}