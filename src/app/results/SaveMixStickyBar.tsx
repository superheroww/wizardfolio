"use client";

import type { FC } from "react";

export type SaveMixStickyBarProps = {
  onSaveClick: () => void;
  isSaving: boolean;
  hasSaved: boolean;
};

const SaveMixStickyBar: FC<SaveMixStickyBarProps> = ({
  onSaveClick,
  isSaving,
  hasSaved,
}) => {
  const label = hasSaved
    ? "Saved"
    : isSaving
      ? "Saving..."
      : "Save mix";
  const title = hasSaved ? "Mix saved" : "Save this mix to compare";
  const subtitle = hasSaved
    ? "It’s now in your dashboard."
    : "Keep it to revisit or stack against another mix.";

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 md:hidden">
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-full border border-neutral-200 bg-neutral-900/95 px-4 py-2 text-xs text-neutral-50 shadow-lg shadow-black/10 backdrop-blur">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-300">
            {title}
          </span>
          <span className="text-[11px] text-neutral-200">{subtitle}</span>
        </div>
        <button
          type="button"
          onClick={onSaveClick}
          disabled={isSaving || hasSaved}
          className="inline-flex items-center rounded-full bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {label}
        </button>
      </div>
    </div>
  );
};

export default SaveMixStickyBar;