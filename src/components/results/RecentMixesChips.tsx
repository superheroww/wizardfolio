"use client";

import { RecentMix } from "@/hooks/useRecentMixes";
import { usePostHogSafe } from "@/lib/usePostHogSafe";

type RecentMixesChipsProps = {
  recentMixes: RecentMix[];
  isAuthenticated: boolean;
  onSelectMix: (mix: RecentMix) => void;
  onSignInClick?: () => void;
  showTitle?: boolean;
  maxChips?: number;
  className?: string;
};

export default function RecentMixesChips({
  recentMixes,
  isAuthenticated,
  onSelectMix,
  onSignInClick,
  showTitle = true,
  maxChips = 3,
  className,
}: RecentMixesChipsProps) {
  const { capture } = usePostHogSafe();

  if (!recentMixes || recentMixes.length === 0) {
    return null;
  }

  const visibleMixes = recentMixes.slice(0, maxChips);

  return (
    <div className={["mb-3", className].filter(Boolean).join(" ")}>
      {showTitle && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-neutral-500">Recent mixes</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {visibleMixes.map((mix) => (
            <button
              key={mix.id}
              type="button"
              onClick={() => {
                capture("recent_mix_chip_clicked", {
                  mix_id: mix.id,
                  source: mix.source,
                  surface: "results_editor_header",
                });
                onSelectMix(mix);
              }}
              className="inline-flex max-w-[60%] items-center truncate rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
            >
              <span className="truncate">{mix.label}</span>
            </button>
          ))}
        </div>

        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              capture("recent_mix_create_account_clicked", {
                surface: "results_editor_header",
              });
              onSignInClick?.();
            }}
            className="inline-flex items-center rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-black active:bg-black/80"
          >
            Create free account
          </button>
        )}
      </div>
    </div>
  );
}
