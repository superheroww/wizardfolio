"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeExposure,
  ExposureBreakdown,
  UserPosition,
} from "@/lib/exposureEngine";
import ExposureSummary from "@/components/ExposureSummary";
import HoldingsTable from "@/components/HoldingsTable";
import { DEFAULT_POSITIONS } from "@/data/defaultPositions";
import { useRouter, useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const positionsParam = searchParams.get("positions");

  const positions = useMemo<UserPosition[]>(() => {
    if (!positionsParam) return DEFAULT_POSITIONS;
    try {
      return JSON.parse(
        decodeURIComponent(positionsParam)
      ) as UserPosition[];
    } catch {
      return DEFAULT_POSITIONS;
    }
  }, [positionsParam]);

  const [exposure, setExposure] = useState<ExposureBreakdown[]>([]);
  const [slide, setSlide] = useState<0 | 1>(0); // 0 = exposure, 1 = holdings
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);

  const top5 = useMemo(
    () =>
      [...exposure]
        .sort((a, b) => b.weightPct - a.weightPct)
        .slice(0, 5),
    [exposure]
  );

  const top10 = useMemo(
    () =>
      [...exposure]
        .sort((a, b) => b.weightPct - a.weightPct)
        .slice(0, 10),
    [exposure]
  );

  useEffect(() => {
    setExposure(computeExposure(positions));
    setSlide(0);
    setShowMore(false);
  }, [positions]);

  const handleEditInputs = () => {
    router.push("/");
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Portfolio Exposure",
          text: "Check out my portfolio look-through powered by WizardFolio",
          url: shareUrl,
        });
      } catch {
        // user cancelled share, ignore
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;

    // simple swipe threshold
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // swipe left → next slide
        setSlide((prev) => (prev === 0 ? 1 : 1));
      } else {
        // swipe right → prev slide
        setSlide((prev) => (prev === 1 ? 0 : 0));
      }
      // whenever user changes slide, reset "showMore"
      setShowMore(false);
    }

    setTouchStartX(null);
  };

  const title =
    slide === 0 ? "Your true exposure" : "Holdings breakdown";

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-blue-600 p-px shadow-2xl shadow-pink-400/50">
        <div className="flex flex-col gap-4 rounded-3xl bg-white/95 p-5 dark:bg-zinc-900/80">
          {/* Header inside the card */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Powered by WizardFolio • Swipe or tap the dots to explore.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Share icon */}
              <button
                onClick={handleShare}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <Share2 className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
              </button>

              {/* Edit inputs */}
              <button
                type="button"
                onClick={handleEditInputs}
                className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Instagram-style content block */}
          <div
            className="rounded-2xl border border-zinc-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {slide === 0 ? (
              <ExposureSummary exposure={exposure} showHeader={false} />
            ) : (
              <>
                <HoldingsTable
                  exposure={showMore ? top10 : top5}
                  showHeader={false}
                />
                <div className="mt-3 flex justify-center">
                  {!showMore ? (
                    <button
                      type="button"
                      onClick={() => setShowMore(true)}
                      className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      See more
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMore(false)}
                      className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-300"
                    >
                      See less
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Gallery dots */}
          <div className="flex justify-center gap-2 pt-1">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSlide(idx as 0 | 1);
                  setShowMore(false);
                }}
                className="group"
                aria-label={idx === 0 ? "Exposure" : "Holdings"}
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

        {/* Branding Overlay */}
        <div className="absolute bottom-2 left-3 z-20 text-[10px] font-semibold tracking-wide text-white/70 dark:text-white/60">
          Powered by <span className="text-white/90">WizardFolio</span>
        </div>
      </div>
    </div>
  );
}