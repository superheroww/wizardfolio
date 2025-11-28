"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeExposure,
  ExposureBreakdown,
  UserPosition,
} from "@/lib/exposureEngine";
import ExposureSummary from "@/components/ExposureSummary";
import HoldingsTable from "@/components/HoldingsTable";
import RegionExposureChart from "@/components/RegionExposureChart";
import OffersCard from "@/components/OffersCard";
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
  const [slide, setSlide] = useState<0 | 1 | 2>(0); // 0 = exposure, 1 = region, 2 = holdings
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const top10 = useMemo(
    () =>
      [...exposure]
        .sort((a, b) => (b.weightPct ?? 0) - (a.weightPct ?? 0))
        .slice(0, 10),
    [exposure]
  );

  useEffect(() => {
    setExposure(computeExposure(positions));
    setSlide(0);
  }, [positions]);

  const handleEditInputs = () => router.push("/");

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
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) =>
    setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;

    // swipe threshold
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // left → next slide
        setSlide((prev) => (prev === 2 ? 2 : ((prev + 1) as 0 | 1 | 2)));
      } else {
        // right → previous slide
        setSlide((prev) => (prev === 0 ? 0 : ((prev - 1) as 0 | 1 | 2)));
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
      default:
        return "Your true exposure";
    }
  })();

  return (
    <div className="space-y-4">
      {/* Gallery card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-blue-600 p-px shadow-2xl shadow-pink-400/50">
        {/* Share button in top-right */}
        <button
          onClick={handleShare}
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur border border-white/50 shadow-sm hover:bg-white dark:bg-zinc-800/70 dark:hover:bg-zinc-800"
        >
          <Share2 className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
        </button>

        <div className="flex flex-col gap-4 rounded-3xl bg-white/95 p-5 dark:bg-zinc-900/80">
          {/* Header inside card */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Powered by WizardFolio • Swipe or tap the dots to explore.
            </p>
          </div>

          {/* Content block (3-slide gallery) */}
          <div
            className="rounded-2xl border border-zinc-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900 min-h-[320px] flex flex-col justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {slide === 0 && (
              <ExposureSummary exposure={exposure} showHeader={false} />
            )}
            {slide === 1 && (
              <RegionExposureChart exposure={exposure} embedded />
            )}
            {slide === 2 && (
              <HoldingsTable exposure={top10} showHeader={false} />
            )}
          </div>

          {/* Gallery dots: exposure • region • holdings */}
          <div className="flex justify-center gap-2 pt-1">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlide(idx as 0 | 1 | 2)}
                className="group"
                aria-label={
                  idx === 0
                    ? "Exposure"
                    : idx === 1
                    ? "Region"
                    : "Holdings"
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

        {/* Branding Overlay */}
        <div className="absolute bottom-2 left-3 z-20 text-[10px] font-semibold tracking-wide text-white/70 dark:text-white/60">
          Powered by <span className="text-white/90">WizardFolio</span>
        </div>
      </div>

      {/* Your mix (original ETFs / positions) */}
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
                {(pos.weightPct ?? 0).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Based on the mix you entered on the previous step.
        </p>
      </section>

      {/* Offers card: Simplii + broker (Questrade or Wealthsimple) */}
      <OffersCard
        broker="questrade" // or "wealthsimple"
        simpliiReferralUrl="https://blue.mbsy.co/789ll2"
        wealthsimpleReferralUrl="www.wealthsimple.com/invite/SL6S1G"
        questradeReferralUrl="https://start.questrade.com/?oaa_promo=646631628488027&s_cid=RAF14_share_link_refer_a_friend_email&utm_medium=share_link&utm_source=refer_a_friend&utm_campaign=RAF14&utm_content=personalized_link"
      />
    </div>
  );
}
