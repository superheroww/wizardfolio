"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
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
import { toPng } from "html-to-image";

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

  // ref for the whole “gallery” card we want to turn into an image
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Limit holdings to top 10 for teaser
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
  }, [positions]);

  const handleEditInputs = () => router.push("/");

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      // Turn the card into a PNG data URL
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "wizardfolio-exposure.png", {
        type: "image/png",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Portfolio Exposure",
          text: "Powered by WizardFolio",
        });
      } else {
        // Fallback: download PNG if files can’t be shared
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "wizardfolio-exposure.png";
        link.click();
      }
    } catch (err) {
      console.error("Error sharing image", err);
      // Last-resort fallback: do nothing or show a toast if you add one later
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) =>
    setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > 40) {
      setSlide(deltaX < 0 ? 1 : 0);
    }

    setTouchStartX(null);
  };

  const title =
    slide === 0 ? "Your true exposure" : "Holdings breakdown";

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-indigo-500 to-blue-600 p-px shadow-2xl shadow-pink-400/50"
      >
        {/* SHARE BUTTON — absolute top right */}
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

          {/* Content Block */}
          <div
            className="rounded-2xl border border-zinc-100 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {slide === 0 ? (
              <ExposureSummary exposure={exposure} showHeader={false} />
            ) : (
              <HoldingsTable exposure={top10} showHeader={false} />
            )}
          </div>

          {/* Gallery dots */}
          <div className="flex justify-center gap-2 pt-1">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlide(idx as 0 | 1)}
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