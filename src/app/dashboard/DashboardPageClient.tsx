"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { buildPositionsSearchParams } from "@/lib/positionsQuery";
import { formatMixSummary } from "@/lib/mixFormatting";
import {
  DEFAULT_SAVED_MIX_NAME,
  SAVED_MIX_NAME_ERROR_MESSAGE,
  SAVED_MIX_NAME_MAX_LENGTH,
  type SavedMix,
} from "@/lib/savedMixes";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { AuthPrompt } from "@/components/auth/AuthPrompt";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

type SavedMixesResponse = {
  ok?: boolean;
  mixes?: SavedMix[];
  mix?: SavedMix;
  error?: string;
};

type ActionStatus = {
  type: "success" | "error";
  message: string;
};

const MIX_LOAD_ERROR =
  "Unable to load saved mixes. Please try again shortly.";

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

async function buildSavedMixesHeaders() {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  const accessToken = data.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export default function DashboardPageClient() {
  const user = useSupabaseUser();
  const [mixes, setMixes] = useState<SavedMix[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<ActionStatus | null>(null);
  const [activeRenameId, setActiveRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleNewMix = () => {
    router.push("/");
  };

  const loadMixes = useCallback(async () => {
    if (!user) {
      throw new Error("Not signed in.");
    }

    const headers = await buildSavedMixesHeaders();
    const response = await fetch("/api/saved-mixes", {
      method: "GET",
      headers,
      credentials: "same-origin",
    });

    const payload = (await response
      .json()
      .catch(() => ({}))) as SavedMixesResponse;

    if (!response.ok || !payload.ok) {
      throw new Error(payload?.error ?? MIX_LOAD_ERROR);
    }

    return payload.mixes ?? [];
  }, [user]);

  const refreshMixes = useCallback(async () => {
    try {
      const refreshed = await loadMixes();
      setMixes(refreshed);
      setErrorMessage(null);
      return refreshed;
    } catch (error) {
      const message = error instanceof Error ? error.message : MIX_LOAD_ERROR;
      setErrorMessage(message);
      throw error;
    }
  }, [loadMixes]);

  useEffect(() => {
    if (!user) {
      setMixes(null);
      setIsLoading(false);
      setErrorMessage(null);
      setActionStatus(null);
      setActiveRenameId(null);
      setRenameError(null);
      setDeleteConfirmId(null);
      setRenameName("");
      setActionLoadingId(null);
      return;
    }

    let isActive = true;

    const run = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setActionStatus(null);

      try {
        const fetched = await loadMixes();
        if (!isActive) return;
        setMixes(fetched);
      } catch (error) {
        if (!isActive) return;
        setErrorMessage(
          error instanceof Error ? error.message : MIX_LOAD_ERROR,
        );
        setMixes([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, [loadMixes, user]);

  const startRename = (mix: SavedMix) => {
    setActiveRenameId(mix.id);
    setRenameName(mix.name);
    setRenameError(null);
    setDeleteConfirmId(null);
    setActionStatus(null);
  };

  const toggleDeleteConfirm = (mixId: string) => {
    setDeleteConfirmId((current) => (current === mixId ? null : mixId));
    setActiveRenameId(null);
    setRenameError(null);
    setActionStatus(null);
  };

  const handleRenameSubmit = async (mix: SavedMix) => {
    setRenameError(null);
    const trimmed = renameName.trim();
    if (trimmed.length > SAVED_MIX_NAME_MAX_LENGTH) {
      setRenameError(SAVED_MIX_NAME_ERROR_MESSAGE);
      return;
    }

    const updatedName = trimmed || DEFAULT_SAVED_MIX_NAME;
    setActionLoadingId(mix.id);
    setActionStatus(null);

    try {
      const headers = await buildSavedMixesHeaders();
      const response = await fetch("/api/saved-mixes", {
        method: "PATCH",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({ id: mix.id, name: updatedName }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as SavedMixesResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error ?? "Unable to rename mix.");
      }

      await refreshMixes();
      setActionStatus({
        type: "success",
        message: "Mix renamed.",
      });
      setActiveRenameId(null);
      setRenameName("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to rename mix. Please try again.";
      setActionStatus({
        type: "error",
        message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async (mixId: string) => {
    setActionLoadingId(mixId);
    setActionStatus(null);

    try {
      const headers = await buildSavedMixesHeaders();
      const response = await fetch("/api/saved-mixes", {
        method: "DELETE",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({ id: mixId }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as SavedMixesResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error ?? "Unable to delete mix.");
      }

      await refreshMixes();
      setActionStatus({
        type: "success",
        message: "Mix deleted.",
      });
      setDeleteConfirmId(null);
      setActiveRenameId(null);
      setRenameName("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete mix. Please try again.";
      setActionStatus({
        type: "error",
        message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!user) {
    return (
      <section className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-zinc-50">
            Saved mixes
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-zinc-400">
            Sign in to save mixes, revisit them later, and build on your favorite
            ETF combos.
          </p>
        </div>
        <AuthPrompt />
      </section>
    );
  }

  const hasMixes = Boolean(mixes && mixes.length > 0);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-zinc-50">
              Saved mixes
            </h1>
            <p className="text-sm text-neutral-500 dark:text-zinc-400">
              Re-open any mix and see exposures right where you left off.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewMix}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:opacity-60 dark:focus-visible:ring-offset-zinc-900 md:w-auto"
          >
            New mix
          </button>
        </div>
      </div>

      {actionStatus && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            actionStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
          }`}
        >
          {actionStatus.message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-neutral-300">
          Loading saved mixes...
        </div>
      ) : hasMixes && mixes ? (
        <div className="grid gap-4 md:grid-cols-2">
          {mixes.map((mix) => {
            const query = buildPositionsSearchParams(mix.positions);
            if (!query) {
              return null;
            }

            const isRenaming = activeRenameId === mix.id;
            const isDeleteConfirm = deleteConfirmId === mix.id;
            const isBusy = actionLoadingId === mix.id;

            return (
              <div
                key={mix.id}
                className="group rounded-3xl border border-zinc-200 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-600"
              >
                <Link
                  href={`/results?${query}`}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-zinc-50">
                      {mix.name}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400">
                    {summarizeMix(mix)}
                  </p>
                </Link>
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                  {formatUpdatedAt(mix.updated_at)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                  <button
                    type="button"
                    onClick={() => startRename(mix)}
                    disabled={isBusy}
                    className="text-zinc-500 transition hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    Rename
                  </button>
                  {isDeleteConfirm ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDeleteConfirm(mix.id)}
                        disabled={isBusy}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-600 transition hover:border-rose-300 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                      >
                        {isBusy ? "Deleting…" : "Confirm delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={isBusy}
                        className="text-[11px] text-zinc-500 transition hover:text-zinc-300 dark:hover:text-zinc-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleDeleteConfirm(mix.id)}
                      disabled={isBusy}
                      className="text-rose-600 transition hover:text-rose-500"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {isRenaming && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleRenameSubmit(mix);
                    }}
                    className="mt-3 space-y-2"
                  >
                    <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                      New mix name
                      <input
                        type="text"
                        value={renameName}
                        maxLength={SAVED_MIX_NAME_MAX_LENGTH}
                        onChange={(event) => setRenameName(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-neutral-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:opacity-60"
                      >
                        {isBusy ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveRenameId(null)}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-700 transition hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500"
                      >
                        Cancel
                      </button>
                    </div>
                    {renameError && (
                      <p className="text-xs text-rose-500">{renameError}</p>
                    )}
                  </form>
                )}
              </div>
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
