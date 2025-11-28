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
  const [slide, setSlide] = useState<0 | 1 | 2 | 3>(0); // 0 = exposure, 1 = region, 2 = holdings, 3 = perks
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

  // Go back to home with same positions encoded in the URL
  const handleEditInputs = () => {
    if (positionsParam) {
      router.push(`/?positions=${positionsParam}`);
    } else {
      router.push("/");
    }
  };

const handleShare = async () => {
  const shareUrl = window.location.href;

  const shareData = {
    title: "My Portfolio Exposure",
    text: "Check out my portfolio look-through powered by WizardFolio",
    url: shareUrl,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      // If user cancels, just silently return
      // If it fails for another reason, fall through to clipboard
      console.warn("navigator.share failed, falling back to clipboard:", err);
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy link:", err);
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
        setSlide((prev) => (prev === 3 ? 3 : ((prev + 1) as 0 | 1 | 2 | 3)));
      } else {
        // right → previous slide
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
        return "Optional Perks";
      default:
        return "Your true exposure";
    }
  })();

  const simpliiReferralUrl =
    process.env.NEXT_PUBLIC_SIMPLII_REFERRAL_URL ?? "";
  const questradeReferralUrl =
    process.env.NEXT_PUBLIC_QUESTRADE_REFERRAL_URL ?? "";

  return (
    <div className="space-y-4">
      {/* 🔝 Top header with title + Change ETFs button */}
      <header className="flex items-center justify-between px-1 sm:px-0 pt-1 pb-1">
        <button
          type="button"
          onClick={handleEditInputs}
          className="rounded-full border border-zinc-300/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-white active:scale-95 transition dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Change ETFs
        </button>
      </header>

      {/* Gallery card (now 4 slides) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-blue-600 p-px shadow-2xl shadow-pink-400/50">
        {/* Share button in top-right of card */}
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

          {/* Content block (4-slide gallery) */}
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

            {slide === 3 && (
              <div className="space-y-3 text-xs sm:text-sm">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Completely optional — but if you’re already planning to open
                  or move an account, these links can give both of us a small
                  bonus.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Simplii perk */}
                  <div className="flex flex-col justify-between rounded-2xl border border-amber-100 bg-white/90 p-3 text-xs shadow-sm dark:border-amber-900/40 dark:bg-zinc-900">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                        Simplii Financial™
                      </p>
                      <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                        New to Simplii? Open an eligible no-fee account with my
                        link and, once you meet the deposit or spend
                        requirement, we both earn a cash reward.
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        For new clients only. Canadian residents (no Quebec).
                        Funding/spend rules apply; see Simplii’s full
                        Refer-a-Friend terms.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!simpliiReferralUrl}
                      onClick={() =>
                        simpliiReferralUrl &&
                        window.open(
                          simpliiReferralUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="mt-2 inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Use Simplii invite
                    </button>
                  </div>

                  {/* Questrade perk */}
                  <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white/90 p-3 text-xs shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        Questrade
                      </p>
                      <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                        Opening a Questrade self-directed or Questwealth
                        account? Using my link and funding with at least $250
                        unlocks a referral cash reward for both of us.
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        For new Questrade clients only. Minimum funding, timing
                        and account eligibility rules apply. Referral rewards
                        count as contributions in registered accounts.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!questradeReferralUrl}
                      onClick={() =>
                        questradeReferralUrl &&
                        window.open(
                          questradeReferralUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="mt-2 inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Use Questrade invite
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
                  WizardFolio doesn’t run these promotions — they come directly
                  from each institution. Always check their latest terms.
                </p>
              </div>
            )}
          </div>

          {/* Gallery dots: exposure • region • holdings • perks */}
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
                    : "Optional perks"
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