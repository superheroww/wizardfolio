"use client";

import type { FC } from "react";

export type SaveMixCtaProps = {
  onSaveClick: () => void;
  isSaving: boolean;
  hasSaved: boolean;
  statusMessage?: { type: "success" | "error"; message: string } | null;
};

const SaveMixCta: FC<SaveMixCtaProps> = ({
  onSaveClick,
  isSaving,
  hasSaved,
  statusMessage,
}) => {
  const label = hasSaved
    ? "Mix saved"
    : isSaving
      ? "Saving..."
      : "Save this mix to compare later";

  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">
            Save this mix to compare later
          </p>
          <p className="text-xs text-neutral-600">
            Keep this combination in your dashboard so you can revisit or stack it against another mix anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={onSaveClick}
          disabled={isSaving || hasSaved}
          className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {label}
        </button>
      </div>

      {statusMessage && (
        <p
          className={`mt-2 text-xs ${
            statusMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {statusMessage.message}
        </p>
      )}
    </div>
  );
};

export default SaveMixCta;
