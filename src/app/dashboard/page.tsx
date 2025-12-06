import Link from "next/link";
import { buildPositionsSearchParams } from "@/lib/positionsQuery";
import { formatMixSummary } from "@/lib/mixFormatting";
import type { SavedMix } from "@/lib/savedMixes";
import { AuthPrompt } from "@/components/auth/AuthPrompt";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export const dynamic = "force-dynamic";

function summarizeMix(mix: SavedMix) {
  const summary = formatMixSummary(mix.positions);
  if (!summary) {
    const count = mix.positions.length;
    return `${count} position${count === 1 ? "" : "s"}`;
  }

  const segments = summary.split(" · ");
  if (segments.length <= 3) {
    return summary;
  }

  return `${segments.slice(0, 3).join(" · ")} · +${segments.length - 3}`;
}

function formatUpdatedAt(updatedAt?: string | null) {
  if (!updatedAt) {
    return "Updated recently";
  }

  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "Updated recently";
  }

  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) {
    return `Updated ${minutes || 1} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.floor(days / 7);
  return `Updated ${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return (
      <section className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-zinc-50">
            Saved mixes
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-zinc-400">
            Sign in to save mixes, revisit them later, and build on your
            favorite ETF combos.
          </p>
        </div>
        <AuthPrompt />
      </section>
    );
  }

  const { data: mixesData, error } = await supabase
    .from("saved_mixes")
    .select("id,name,positions,updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });

  const mixes = (mixesData ?? []) as SavedMix[];

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-zinc-50">
          Saved mixes
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-zinc-400">
          Re-open any mix and see exposures right where you left off.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          Unable to load saved mixes. Please try again shortly.
        </div>
      )}

      {mixes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {mixes.map((mix) => {
            const query = buildPositionsSearchParams(mix.positions);
            if (!query) {
              return null;
            }

            return (
              <Link
                key={mix.id}
                href={`/results?${query}`}
                className="group rounded-3xl border border-zinc-200 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-600"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-zinc-50">
                    {mix.name}
                  </p>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                    Open
                  </span>
                </div>
                <p className="mt-3 text-xs text-neutral-500 dark:text-zinc-400">
                  {summarizeMix(mix)}
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                  {formatUpdatedAt(mix.updated_at)}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/80 p-6 text-sm text-neutral-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-neutral-300">
          <p className="font-semibold text-neutral-900 dark:text-zinc-50">
            No saved mixes yet?
          </p>
          <p className="mt-2 text-xs text-neutral-500 dark:text-zinc-400">
            Head back to the results screen, save your mix, and it will show up
            here for easy access next time.
          </p>
        </div>
      )}
    </section>
  );
}
