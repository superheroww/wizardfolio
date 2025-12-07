"use client";

import { useEffect, useRef, useState } from "react";
import type { ApiExposureRow } from "@/lib/exposureEngine";
import type { CompareSelection } from "./types";
import { formatMixSummary } from "@/lib/mixFormatting";
import CompareView from "./CompareView";

type SlotExposure = {
  selection: CompareSelection;
  exposures: ApiExposureRow[];
  loading: boolean;
  error: string | null;
};

type CompareResultsModalProps = {
  open: boolean;
  mixA: SlotExposure;
  mixB: SlotExposure;
  onClose: () => void;
};

export default function CompareResultsModal({
  open,
  mixA,
  mixB,
  onClose,
}: CompareResultsModalProps) {
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const scrollPosition = useRef(0);

  useEffect(() => {
    if (!open) {
      setIsVisible(false);
      const timer = window.setTimeout(() => {
        setIsRendered(false);
      }, 220);
      document.body.style.overflow = "";
      window.scrollTo(0, scrollPosition.current);
      return () => window.clearTimeout(timer);
    }

    setIsRendered(true);
    requestAnimationFrame(() => setIsVisible(true));
    scrollPosition.current = window.scrollY;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [open, onClose]);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex px-3 pb-4 pt-16 sm:items-center sm:justify-center sm:pb-0 sm:pt-0 ${
        isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      } items-end justify-center bg-black/40 transition-opacity duration-200`}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className={`flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-200 ${
          isVisible
            ? "translate-y-0 scale-100 sm:scale-100"
            : "translate-y-full sm:scale-95"
        } h-[90vh] sm:h-auto sm:max-h-[90vh]`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-neutral-500">
              Compare mixes
            </p>
            <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
              Mix A vs Mix B
            </h2>
            <p className="text-[11px] text-neutral-600">
              <span className="font-medium text-neutral-700">Mix A:</span>{" "}
              {formatMixSummary(mixA.selection.positions)}
              <span className="mx-2">·</span>
              <span className="font-medium text-neutral-700">Mix B:</span>{" "}
              {formatMixSummary(mixB.selection.positions)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 px-3 py-1 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <CompareView mixA={mixA} mixB={mixB} />
        </div>
      </div>
    </div>
  );
}
