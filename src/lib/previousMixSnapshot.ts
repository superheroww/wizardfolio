import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { UserPosition } from "@/lib/exposureEngine";

export type PreviousMixContext = {
  source: "scratch" | "template" | "url";
  templateKey?: string | null;
  benchmarkSymbol?: string | null;
  anonId: string;
  userId: string | null;
};

export type AddLocalSnapshotFn = (
  positions: UserPosition[],
) => { didAdd: boolean; mixId: string | null; key: string | null };

export async function snapshotPreviousMix(
  positions: UserPosition[],
  context: PreviousMixContext,
  addLocalSnapshot: AddLocalSnapshotFn,
): Promise<{ didAdd: boolean; mixId: string | null }> {
  const { didAdd, mixId } = addLocalSnapshot(positions);

  if (!didAdd) {
    return { didAdd: false, mixId: null };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("mix_events").insert({
      positions,
      benchmark_symbol: context.benchmarkSymbol ?? null,
      source: context.source,
      template_key: context.templateKey ?? null,
      referrer: "previous_mix_snapshot",
      anon_id: context.anonId,
      user_id: context.userId,
    });

    if (error) {
      // Best-effort logging only
      console.error("[mix_events] snapshot insert error", error.message);
    }
  } catch (error) {
    // Best-effort logging only
    const err = error as Error;
    console.error("[mix_events] snapshot insert unexpected error", err?.message);
  }

  return { didAdd: true, mixId };
}
