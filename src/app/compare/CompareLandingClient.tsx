"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthDialog } from "@/components/auth/AuthDialog";
import CompareSlot from "./CompareSlot";
import CompareSelectorModal from "./CompareSelectorModal";
import CompareView from "./CompareView";
import LoginRequiredCard from "./LoginRequiredCard";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import type { ApiExposureRow, UserPosition } from "@/lib/exposureEngine";
import { BENCHMARK_MIXES } from "@/lib/benchmarkPresets";
import { QUICK_START_TEMPLATES } from "@/components/QuickStartTemplates";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { normalizePositions } from "@/lib/positionsQuery";
import { useSupabaseAuthState } from "@/hooks/useSupabaseUser";
import type {
  CompareSavedMix,
  CompareSelection,
  CompareSelectorTabId,
  CompareSlotId,
} from "./types";

type SlotExposureState = {
  exposures: ApiExposureRow[];
  loading: boolean;
  error: string | null;
};

const createEmptyExposureState = (): SlotExposureState => ({
  exposures: [],
  loading: false,
  error: null,
});

const slotOrder: CompareSlotId[] = ["A", "B"];

export default function CompareLandingClient() {
  const router = useRouter();
  const { capture } = usePostHogSafe();
  const { user, isLoading: isAuthLoading } = useSupabaseAuthState();
  const isSignedIn = Boolean(user);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<CompareSlotId>("A");
  const [savedMixes, setSavedMixes] = useState<CompareSavedMix[]>([]);
  const [selectorTab, setSelectorTab] = useState<CompareSelectorTabId>(
    savedMixes.length ? "your-mixes" : "benchmarks",
  );
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [selectedMixes, setSelectedMixes] = useState<
    Record<CompareSlotId, CompareSelection | null>
  >({
    A: null,
    B: null,
  });
  const [slotExposures, setSlotExposures] = useState<Record<
    CompareSlotId,
    SlotExposureState
  >>({
    A: createEmptyExposureState(),
    B: createEmptyExposureState(),
  });
  const [editingScratchSlot, setEditingScratchSlot] =
    useState<CompareSlotId | null>(null);
  const [scratchDraftPositions, setScratchDraftPositions] = useState<
    Record<CompareSlotId, UserPosition[]>
  >(() => ({
    A: [{ symbol: "", weightPct: 0 }],
    B: [{ symbol: "", weightPct: 0 }],
  }));
  const exposureCacheRef = useRef(new Map<string, ApiExposureRow[]>());

  const defaultSelectorTab = useMemo<CompareSelectorTabId>(() => {
    return savedMixes.length ? "your-mixes" : "benchmarks";
  }, [savedMixes.length]);

  useEffect(() => {
    capture("compare_opened");
  }, [capture]);

  useEffect(() => {
    if (modalOpen) {
      setSelectorTab(defaultSelectorTab);
    }
  }, [modalOpen, defaultSelectorTab]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let isActive = true;

    if (!isSignedIn || !user?.id) {
      setSavedMixes([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    const loadSavedMixes = async () => {
      const { data, error } = await supabase
        .from("saved_mixes")
        .select("id,name,positions")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Failed to load saved mixes", error);
        setSavedMixes([]);
        return;
      }

      const mixes = (data ?? []).map((mix) => ({
        id: mix.id,
        name: mix.name ?? "My mix",
        positions: normalizePositions(
          Array.isArray(mix.positions) ? mix.positions : [],
        ),
      }));

      setSavedMixes(mixes);
    };

    loadSavedMixes();

    return () => {
      isActive = false;
    };
  }, [isAuthLoading, isSignedIn, user?.id]);

  const handleSlotClick = (slot: CompareSlotId) => {
    if (isAuthLoading) {
      return;
    }

    if (!isSignedIn) {
      setAuthDialogOpen(true);
      return;
    }

    setActiveSlot(slot);
    setModalOpen(true);
  };

  const handleModalSelect = (selection: CompareSelection) => {
    if (selection.source === "scratch") {
      const draftPositions = scratchDraftPositions[activeSlot];
      setSelectedMixes((prev) => ({
        ...prev,
        [activeSlot]: {
          ...selection,
          positions:
            draftPositions && draftPositions.length
              ? draftPositions
              : [{ symbol: "", weightPct: 0 }],
        },
      }));
      setEditingScratchSlot(activeSlot);
      capture("compare_slot_selected", {
        slot: activeSlot,
        source: selection.source,
      });
      setModalOpen(false);
      return;
    }

    setSelectedMixes((prev) => ({
      ...prev,
      [activeSlot]: selection,
    }));
    if (editingScratchSlot === activeSlot) {
      setEditingScratchSlot(null);
    }
    capture("compare_slot_selected", {
      slot: activeSlot,
      source: selection.source,
    });
    setModalOpen(false);
  };

  const handleExposureUpdate = (
    slot: CompareSlotId,
    selection: CompareSelection | null,
  ) => {
    let isActive = true;

    if (!selection || !selection.positions.length) {
      setSlotExposures((prev) => ({
        ...prev,
        [slot]: createEmptyExposureState(),
      }));

      return () => {
        isActive = false;
      };
    }

    const key = buildPositionsKey(selection.positions);
    const cached = exposureCacheRef.current.get(key);

    if (cached) {
      setSlotExposures((prev) => ({
        ...prev,
        [slot]: {
          exposures: cached,
          loading: false,
          error: null,
        },
      }));
      return () => {
        isActive = false;
      };
    }

    setSlotExposures((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        loading: true,
        error: null,
      },
    }));

    fetchMixExposure(selection.positions)
      .then((rows) => {
        if (!isActive) return;

        exposureCacheRef.current.set(key, rows);
        setSlotExposures((prev) => ({
          ...prev,
          [slot]: {
            exposures: rows,
            loading: false,
            error: null,
          },
        }));
      })
      .catch((error) => {
        if (!isActive) return;

        setSlotExposures((prev) => ({
          ...prev,
          [slot]: {
            exposures: [],
            loading: false,
            error: error.message ?? "Unable to load exposures.",
          },
        }));
      });

    return () => {
      isActive = false;
    };
  };

  useEffect(() => {
    return handleExposureUpdate("A", selectedMixes.A);
  }, [selectedMixes.A]);

  useEffect(() => {
    return handleExposureUpdate("B", selectedMixes.B);
  }, [selectedMixes.B]);

  const handleChangeMixClick = (slot: CompareSlotId) => {
    const current = selectedMixes[slot];
    if (current?.source === "scratch") {
      setEditingScratchSlot(slot);
      return;
    }

    handleSlotClick(slot);
  };

  const handleScratchPositionsChange = (
    slot: CompareSlotId,
    positions: UserPosition[],
  ) => {
    setScratchDraftPositions((prev) => ({
      ...prev,
      [slot]: positions,
    }));

    setSelectedMixes((prev) => {
      const current = prev[slot];
      if (!current || current.source !== "scratch") {
        return prev;
      }

      return {
        ...prev,
        [slot]: {
          ...current,
          positions,
        },
      };
    });
  };

  const handleFinishScratchEditing = (slot: CompareSlotId) => {
    setEditingScratchSlot((current) => (current === slot ? null : current));
  };

  const readyToCompare = Boolean(selectedMixes.A && selectedMixes.B);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm shadow-black/5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-neutral-500">
          Compare
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-900 md:text-4xl">
          Side-by-side ETF exposure comparisons
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-neutral-600 md:text-base">
          Choose any two mixes to see the exposures that matter. Swap benchmarks,
          templates, or your saved mixes in and compare holdings, sectors, and
          regions in the same order on both sides.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {slotOrder.map((slotId) => (
          <div key={slotId} className="h-full">
            {isAuthLoading ? (
              <div
                aria-busy="true"
                className="flex h-full min-h-[200px] flex-col justify-center rounded-3xl border border-neutral-200 bg-white/80 p-5 text-center text-sm text-neutral-500 shadow-sm shadow-black/5"
              >
                <p>Preparing your compare workspace…</p>
                <p className="mt-1 text-xs text-neutral-400">
                  One sec while we load your session.
                </p>
              </div>
            ) : isSignedIn ? (
              <CompareSlot
                slotId={slotId}
                selection={selectedMixes[slotId]}
                onSlotClick={() => handleSlotClick(slotId)}
                onChangeMixClick={() => handleChangeMixClick(slotId)}
                isEditingScratch={editingScratchSlot === slotId}
                scratchPositions={scratchDraftPositions[slotId]}
                onScratchPositionsChange={(positions) =>
                  handleScratchPositionsChange(slotId, positions)
                }
                onScratchEditingDone={() => handleFinishScratchEditing(slotId)}
              />
            ) : (
              <LoginRequiredCard onSignIn={() => setAuthDialogOpen(true)} />
            )}
          </div>
        ))}
      </div>

      {isSignedIn ? (
        readyToCompare ? (
          <CompareView
            mixA={{
              selection: selectedMixes.A!,
              exposures: slotExposures.A.exposures,
              loading: slotExposures.A.loading,
              error: slotExposures.A.error,
            }}
            mixB={{
              selection: selectedMixes.B!,
              exposures: slotExposures.B.exposures,
              loading: slotExposures.B.loading,
              error: slotExposures.B.error,
            }}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/80 p-5 text-sm text-neutral-600 shadow-sm shadow-black/5">
            Select two mixes to reveal the comparison view. Tap any slot above
            to begin.
          </div>
        )
      ) : null}

      {isSignedIn && (
        <CompareSelectorModal
          open={modalOpen}
          activeSlot={activeSlot}
          activeTab={selectorTab}
          benchmarkMixes={BENCHMARK_MIXES}
          quickStartTemplates={QUICK_START_TEMPLATES}
          savedMixes={savedMixes}
          onClose={() => setModalOpen(false)}
          onTabChange={setSelectorTab}
          onSelect={handleModalSelect}
        />
      )}

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthSuccess={() => router.refresh()}
      />
    </div>
  );
}

function buildPositionsKey(positions: UserPosition[]): string {
  return positions
    .map((pos) => ({
      symbol: pos.symbol.trim().toUpperCase(),
      weight: Number.isFinite(pos.weightPct) ? pos.weightPct : 0,
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map((pos) => `${pos.symbol}:${pos.weight.toFixed(4)}`)
    .join("|");
}

async function fetchMixExposure(
  positions: UserPosition[],
): Promise<ApiExposureRow[]> {
  if (!positions.length) {
    return [];
  }

  const response = await fetch("/api/etf-exposure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ positions }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) ?? {};
    throw new Error(
      payload.error ?? "Unable to load exposure details for this mix.",
    );
  }

  const payload = await response.json().catch(() => null);
  return (payload?.exposure as ApiExposureRow[]) ?? [];
}
