// src/lib/previousMixSnapshot.ts
import type { UserPosition } from "@/lib/exposureEngine";
import { logMixEvent } from "@/lib/logMixEvent";

export type PreviousMixSource = "scratch" | "template" | "url";

export type PreviousMixMeta = {
  source: PreviousMixSource;
  templateKey?: string | null;
  benchmarkSymbol?: string | null;
  anonId: string;
  userId?: string | null; // optional, currently only used for analytics if you want
};

type AddLocalMixSnapshotFn = (positions: UserPosition[]) => void;

export async function snapshotPreviousMix(
  positions: UserPosition[],
  meta: PreviousMixMeta,
  addLocalMixSnapshot: AddLocalMixSnapshotFn,
): Promise<void> {
  if (!positions || positions.length === 0) return;

  // 1) Update local chips immediately
  addLocalMixSnapshot(positions);

  // 2) Best-effort logging through the existing admin-powered API route
  try {
    await logMixEvent({
      positions: positions.map((p) => ({
        symbol: p.symbol,
        weightPct: p.weightPct ?? 0,
      })),
      benchmarkSymbol: meta.benchmarkSymbol ?? null,
      source: meta.source,
      templateKey: meta.templateKey ?? null,
      // referrer is optional; you can use this to distinguish flows if you want
      referrer: "results_previous_mix_snapshot",
      anonId: meta.anonId,
    });
  } catch (err) {
    console.error("[mix_events] snapshot insert error", err);
    // best-effort: don't throw to the UI
  }
}