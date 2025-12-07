"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BenchmarkMix } from "@/lib/benchmarkPresets";
import type {
  CompareSavedMix,
  CompareSelectorTabId,
  CompareSelection,
  CompareSlotId,
} from "./types";
import type { QuickStartTemplate } from "@/components/QuickStartTemplates";

const TABS: { id: CompareSelectorTabId; label: string }[] = [
  { id: "your-mixes", label: "Your Mixes" },
  { id: "benchmarks", label: "Benchmarks" },
  { id: "scratch", label: "Start From Scratch" },
  { id: "templates", label: "Templates" },
];

type CompareSelectorModalProps = {
  open: boolean;
  activeSlot: CompareSlotId;
  activeTab: CompareSelectorTabId;
  benchmarkMixes: BenchmarkMix[];
  savedMixes: CompareSavedMix[];
  quickStartTemplates: QuickStartTemplate[];
  onClose: () => void;
  onTabChange: (tab: CompareSelectorTabId) => void;
  onSelect: (selection: CompareSelection) => void;
};

export default function CompareSelectorModal({
  activeSlot,
  activeTab,
  benchmarkMixes,
  savedMixes,
  quickStartTemplates,
  open,
  onClose,
  onTabChange,
  onSelect,
}: CompareSelectorModalProps) {
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
    if (!open) return undefined;

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [onClose, open]);

  const handleSelect = (selection: CompareSelection) => {
    onSelect(selection);
    onClose();
  };

  const renderSavedMixes = useMemo(() => {
    if (!savedMixes.length) {
      return (
        <p className="max-w-sm text-sm text-neutral-600">
          You haven’t saved any mixes yet. Build one in the dashboard to see it
          listed here instantly.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {savedMixes.map((mix) => (
          <button
            key={mix.id}
            type="button"
            onClick={() =>
              handleSelect({
                id: mix.id,
                label: mix.name,
                positions: mix.positions,
                source: "mixes",
              })
            }
            className="w-full rounded-2xl border border-neutral-200 bg-white/70 p-4 text-left shadow-sm transition hover:border-blue-500/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-base font-semibold text-neutral-900">
                {mix.name}
              </h4>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-600">
                Your mix
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {mix.positions.length} ETF
              {mix.positions.length === 1 ? "" : "s"}
            </p>
          </button>
        ))}
      </div>
    );
  }, [savedMixes]);

  const renderBenchmarks = () => (
    <div className="space-y-3">
      {benchmarkMixes.map((benchmark) => (
        <button
          key={benchmark.id}
          type="button"
          onClick={() =>
            handleSelect({
              id: benchmark.id,
              label: benchmark.label,
              positions: benchmark.positions,
              source: "benchmarks",
            })
          }
          className="w-full rounded-2xl border border-neutral-200 bg-white/80 p-4 text-left shadow-sm transition hover:border-blue-500/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-neutral-900">
              {benchmark.label}
            </h4>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-600">
              Benchmark
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {benchmark.description}
          </p>
        </button>
      ))}
    </div>
  );

  const renderScratch = () => (
    <div>
      <button
        type="button"
        onClick={() =>
          handleSelect({
            id: "scratch",
            label: "Start from scratch",
            positions: [],
            source: "scratch",
          })
        }
        className="w-full rounded-3xl border border-dashed border-neutral-300 bg-white/90 px-5 py-6 text-left shadow-sm transition hover:border-blue-500/50 hover:shadow-lg"
      >
        <p className="text-sm font-semibold text-neutral-900">Start from scratch</p>
        <p className="mt-2 text-sm text-neutral-600">
          Build a mix from zero and compare it instantly once the second slot is ready.
        </p>
      </button>
    </div>
  );

  const renderTemplates = () => (
    <div className="grid gap-3">
      {quickStartTemplates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() =>
            handleSelect({
              id: template.id,
              label: template.name,
              positions: template.positions,
              source: "templates",
            })
          }
          className="flex w-full flex-col rounded-2xl border border-neutral-200 bg-white/80 p-4 text-left shadow-sm transition hover:border-blue-500/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{template.emoji}</span>
              <h4 className="text-base font-semibold text-neutral-900">
                {template.name}
              </h4>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-600">
              Template
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">{template.description}</p>
        </button>
      ))}
    </div>
  );

  const tabContent = () => {
    switch (activeTab) {
      case "your-mixes":
        return renderSavedMixes;
      case "benchmarks":
        return renderBenchmarks();
      case "scratch":
        return renderScratch();
      case "templates":
        return renderTemplates();
      default:
        return null;
    }
  };

  if (!isRendered) {
    return null;
  }

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-end justify-center px-4 ${
        isVisible ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        aria-modal="true"
        aria-labelledby="compare-selector-title"
        role="dialog"
        className={`relative w-full max-w-3xl rounded-t-3xl bg-white shadow-2xl transition-transform duration-200 ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full max-h-[85vh] flex-col overflow-hidden rounded-t-3xl bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-neutral-500">
                Slot {activeSlot}
              </p>
              <h2
                id="compare-selector-title"
                className="text-lg font-semibold text-neutral-900"
              >
                Pick a mix for {activeSlot}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-neutral-200 px-3 py-1 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300"
            >
              ×
            </button>
          </div>

          <div className="flex border-b border-neutral-200 bg-white px-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 min-h-[48px] px-3 py-3 text-center text-sm font-semibold transition ${
                  tab.id === activeTab
                    ? "text-blue-600"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab.label}
                <span
                  className={`mt-2 block h-1 rounded-full bg-blue-600 transition-all ${
                    tab.id === activeTab ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {tabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
