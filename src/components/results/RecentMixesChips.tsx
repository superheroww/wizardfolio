"use client";

import { RecentMix } from "@/hooks/useRecentMixes";
import { usePostHogSafe } from "@/lib/usePostHogSafe";

type RecentMixesChipsProps = {
  recentMixes: RecentMix[];
  isAuthenticated: boolean;
  onSelectMix: (mix: RecentMix) => void;
  onSignInClick?: () => void;
  showTitle?: boolean;
  className?: string;
};

export default function RecentMixesChips({
  recentMixes,
  isAuthenticated,
  onSelectMix,
  onSignInClick,
  showTitle = true,
  className,
}: RecentMixesChipsProps) {
  const { capture } = usePostHogSafe();

  const hasMixes = Boolean(recentMixes && recentMixes.length > 0);

  if (!hasMixes && isAuthenticated) {
    return null;
  }

  return (
    <div className={["mb-3", className].filter(Boolean).join(" ")}>
      {showTitle && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-neutral-500">Recent mixes</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {hasMixes &&
          recentMixes.slice(0, 4).map((mix) => (
            <button
              key={mix.id}
              type="button"
              onClick={() => {
                capture("recent_mix_chip_clicked", {
                  mix_id: mix.id,
                  source: mix.source,
                });
                onSelectMix(mix);
              }}
              className="inline-flex max-w-[60%] items-center truncate rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
            >
              <span className="truncate">{mix.label}</span>
            </button>
          ))}

        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              capture("recent_mix_signin_chip_clicked", {});
              onSignInClick?.();
            }}
            className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
          >
            <span>Sign in to save your mixes</span>
          </button>
        )}
      </div>
    </div>
  );
}
