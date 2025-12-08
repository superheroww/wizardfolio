"use client";

import { ETF_UNIVERSE, POPULAR_ETFS } from "@/data/etfUniverse";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type EtfBottomSheetSelectProps = {
  value: string | null;
  onChange: (symbol: string) => void;
};

export default function EtfBottomSheetSelect({
  value,
  onChange,
}: EtfBottomSheetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);
  const labelId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openSheet = useCallback(() => setIsOpen(true), []);
  const closeSheet = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        triggerRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    const dialogNode = dialogRef.current;
    const raf = requestAnimationFrame(() => dialogNode?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeSheet]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = dragHandleRef.current;
    if (!handle) return;

    let startY: number | null = null;

    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY === null) return;
      const currentY = event.touches[0]?.clientY ?? 0;
      if (currentY - startY > 70) {
        startY = null;
        closeSheet();
      }
    };

    const onTouchEnd = () => {
      startY = null;
    };

    handle.addEventListener("touchstart", onTouchStart);
    handle.addEventListener("touchmove", onTouchMove);
    handle.addEventListener("touchend", onTouchEnd);

    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      handle.removeEventListener("touchmove", onTouchMove);
      handle.removeEventListener("touchend", onTouchEnd);
    };
  }, [isOpen, closeSheet]);

  const popularEtfs = useMemo(
    () => ETF_UNIVERSE.filter((symbol) => POPULAR_ETFS.includes(symbol)),
    []
  );
  const otherEtfs = useMemo(
    () =>
      ETF_UNIVERSE.filter((symbol) => !POPULAR_ETFS.includes(symbol)).sort(),
    []
  );

  const handleSelect = useCallback(
    (symbol: string) => {
      onChange(symbol);
      closeSheet();
    },
    [onChange, closeSheet]
  );

  const optionClasses =
    "flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-base font-medium text-neutral-900 transition hover:border-neutral-200 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400";

  const renderOption = (symbol: string) => {
    const isSelected = value === symbol;
    return (
      <button
        key={symbol}
        type="button"
        onClick={() => handleSelect(symbol)}
        className={`${optionClasses} ${
          isSelected ? "border-neutral-300 bg-neutral-100" : "border-transparent"
        }`}
      >
        <span>{symbol}</span>
        {isSelected && (
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Selected
          </span>
        )}
      </button>
    );
  };

  const sheet =
    isMounted && isOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
              aria-hidden="true"
              onClick={closeSheet}
            />
            <div
              className="relative w-full px-4 pb-6 pt-2 md:flex md:items-center md:justify-center md:pb-8"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeSheet();
                }
              }}
            >
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelId}
                tabIndex={-1}
                className="mx-auto flex h-[70vh] w-full max-w-md flex-col rounded-t-3xl border border-neutral-200 bg-white shadow-2xl outline-none transition md:h-auto md:max-h-[80vh] md:rounded-3xl"
              >
                <div className="px-6 pt-4">
                  <div
                    ref={dragHandleRef}
                    className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-200 md:hidden"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <h2
                      id={labelId}
                      className="text-base font-semibold text-neutral-900"
                    >
                      Select ETF
                    </h2>
                    <button
                      type="button"
                      onClick={closeSheet}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-lg text-neutral-500 transition hover:bg-neutral-100"
                      aria-label="Close ETF selector"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex-1 overflow-y-auto px-6 pb-6">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                    Popular ETFs
                  </p>
                  <div className="mt-2 space-y-2">
                    {popularEtfs.map(renderOption)}
                  </div>
                  <div className="my-5 h-px w-full bg-neutral-200" />
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                    All ETFs
                  </p>
                  <div className="mt-2 space-y-2">
                    {otherEtfs.map(renderOption)}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-left text-base text-neutral-900 transition hover:border-neutral-400 sm:text-sm focus-visible:outline-none focus:border-neutral-400"
      >
        <span>{value || "ETF"}</span>
        <svg
          className="h-4 w-4 text-neutral-500"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {sheet}
    </>
  );
}