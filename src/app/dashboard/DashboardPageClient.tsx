"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { buildPositionsSearchParams } from "@/lib/positionsQuery";
import { formatMixSummary } from "@/lib/mixFormatting";
import {
  DEFAULT_SAVED_MIX_NAME,
  SAVED_MIX_NAME_ERROR_MESSAGE,
  SAVED_MIX_NAME_MAX_LENGTH,
  SAVED_MIX_NAME_REQUIRED_MESSAGE,
  type SavedMix,
} from "@/lib/savedMixes";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AuthPrompt } from "@/components/auth/AuthPrompt";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { MoreHorizontal } from "lucide-react";

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
  const [renameTarget, setRenameTarget] = useState<SavedMix | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const trimmedRenameValue = renameValue.trim();
  const isRenameValueValid = trimmedRenameValue.length > 0;
  const [deleteTarget, setDeleteTarget] = useState<SavedMix | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuContentRef = useRef<HTMLDivElement | null>(null);
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
      setRenameTarget(null);
      setRenameValue("");
      setIsRenaming(false);
      setRenameError(null);
      setDeleteTarget(null);
      setDeleteError(null);
      setIsDeleting(false);
      setOpenMenuId(null);
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

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        menuContentRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setOpenMenuId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  const openRenameDialog = (mix: SavedMix) => {
    setRenameTarget(mix);
    setRenameValue(mix.name);
    setRenameError(null);
    setActionStatus(null);
    setDeleteTarget(null);
    setDeleteError(null);
    setIsDeleting(false);
    setOpenMenuId(null);
  };

  const closeRenameDialog = () => {
    setRenameTarget(null);
    setRenameValue("");
    setIsRenaming(false);
    setRenameError(null);
    setOpenMenuId(null);
  };

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renameTarget) {
      return;
    }

    setRenameError(null);
    const trimmedName = renameValue.trim();
    if (!trimmedName) {
      setRenameError(SAVED_MIX_NAME_REQUIRED_MESSAGE);
      return;
    }

    if (trimmedName.length > SAVED_MIX_NAME_MAX_LENGTH) {
      setRenameError(SAVED_MIX_NAME_ERROR_MESSAGE);
      return;
    }

    setIsRenaming(true);
    setActionLoadingId(renameTarget.id);
    setActionStatus(null);

    try {
      const headers = await buildSavedMixesHeaders();
      const response = await fetch("/api/saved-mixes", {
        method: "PATCH",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({ id: renameTarget.id, name: trimmedName }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as SavedMixesResponse;

      if (!response.ok || !payload.ok) {
        const message = payload?.error ?? "Unable to rename mix.";
        setRenameError(message);
        setActionStatus({
          type: "error",
          message,
        });
        return;
      }

      await refreshMixes();
      setActionStatus({
        type: "success",
        message: "Mix renamed.",
      });
      closeRenameDialog();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to rename mix. Please try again.";
      setRenameError(message);
      setActionStatus({
        type: "error",
        message,
      });
    } finally {
      setIsRenaming(false);
      setActionLoadingId(null);
    }
  };

  const openDeleteDialog = (mix: SavedMix) => {
    setDeleteTarget(mix);
    setDeleteError(null);
    setActionStatus(null);
    setRenameTarget(null);
    setRenameError(null);
    setIsRenaming(false);
    setOpenMenuId(null);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteError(null);
    setIsDeleting(false);
    setOpenMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    setActionLoadingId(deleteTarget.id);
    setActionStatus(null);

    try {
      const headers = await buildSavedMixesHeaders();
      const response = await fetch("/api/saved-mixes", {
        method: "DELETE",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as SavedMixesResponse;

      if (!response.ok || !payload.ok) {
        const message = payload?.error ?? "Unable to delete mix.";
        setDeleteError(message);
        setActionStatus({
          type: "error",
          message,
        });
        return;
      }

      await refreshMixes();
      setActionStatus({
        type: "success",
        message: "Mix deleted.",
      });
      closeDeleteDialog();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete mix. Please try again.";
      setDeleteError(message);
      setActionStatus({
        type: "error",
        message,
      });
    } finally {
      setIsDeleting(false);
      setActionLoadingId(null);
    }
  };

  if (!user) {
    return (
      <section className="space-y-4">
        <div className="rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Saved mixes
          </h1>
          <p className="mt-2 text-sm text-neutral-700">
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
      <div className="rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Saved mixes
            </h1>
            <p className="text-sm text-neutral-700">
              Re-open any mix and see exposures right where you left off.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewMix}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:opacity-60 md:w-auto"
          >
            New mix
          </button>
        </div>
      </div>

      {actionStatus && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            actionStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {actionStatus.message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm text-neutral-700 shadow-sm">
          Loading saved mixes...
        </div>
      ) : hasMixes && mixes ? (
        <div className="grid gap-4 md:grid-cols-2">
          {mixes.map((mix) => {
            const query = buildPositionsSearchParams(mix.positions);
            if (!query) {
              return null;
            }

            const isBusy = actionLoadingId === mix.id;

            return (
              <div
                key={mix.id}
                className="group rounded-3xl border border-neutral-200 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/results?${query}`}
                    className="flex flex-1 flex-col gap-3 min-w-0"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-900">
                        {mix.name}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-700">
                      {summarizeMix(mix)}
                    </p>
                  </Link>
                  <div className="relative flex-none">
                    <button
                      type="button"
                      ref={openMenuId === mix.id ? menuButtonRef : null}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === mix.id}
                      aria-label="Open mix menu"
                      disabled={isBusy}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpenMenuId((current) =>
                          current === mix.id ? null : mix.id,
                        );
                      }}
                      className="h-9 w-9 rounded-full border border-transparent bg-white/80 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenuId === mix.id && (
                      <div
                        ref={menuContentRef}
                        role="menu"
                        aria-label={`${mix.name} actions`}
                        className="absolute right-0 top-full z-10 mt-2 w-44 rounded-2xl border border-neutral-200 bg-white py-1 text-sm shadow-lg shadow-black/10"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openRenameDialog(mix)}
                          className="w-full px-4 py-2 text-left font-medium text-neutral-700 transition hover:bg-neutral-100"
                        >
                          Rename
                        </button>
                        <div className="border-t border-neutral-100" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openDeleteDialog(mix)}
                          className="w-full px-4 py-2 text-left font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                  {formatUpdatedAt(mix.updated_at)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white/80 p-6 text-sm text-neutral-700 shadow-sm">
          <p className="font-semibold text-neutral-900">
            No saved mixes yet?
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Head back to the results screen, save your mix, and it will show up
            here for easy access next time.
          </p>
        </div>
      )}
      <ModalDialog
        open={Boolean(renameTarget)}
        onClose={closeRenameDialog}
        title="Rename mix"
        description="Give this mix a short, descriptive name."
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            New mix name
            <input
              type="text"
              value={renameValue}
              maxLength={SAVED_MIX_NAME_MAX_LENGTH}
              onChange={(event) => setRenameValue(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </label>
          {!renameError && !isRenameValueValid && renameValue.length > 0 && (
            <p className="text-xs text-rose-500">
              {SAVED_MIX_NAME_REQUIRED_MESSAGE}
            </p>
          )}
          {renameError && (
            <p className="text-sm text-rose-500">{renameError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeRenameDialog}
              disabled={isRenaming}
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isRenameValueValid || isRenaming}
              className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRenaming ? "Saving…" : "Save name"}
            </button>
          </div>
        </form>
      </ModalDialog>
      <ModalDialog
        open={Boolean(deleteTarget)}
        onClose={closeDeleteDialog}
        title="Delete mix"
      >
        <p className="text-sm text-neutral-700">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-neutral-900">
            “{deleteTarget?.name}”
          </span>
          ? This action can’t be undone.
        </p>
        {deleteError && (
          <p className="mt-2 text-sm text-rose-500">{deleteError}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeDeleteDialog}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </ModalDialog>
    </section>
  );
}

type ModalDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

function ModalDialog({
  open,
  onClose,
  title,
  description,
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    previousActiveElement.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previousActiveElement.current?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl shadow-black/20 outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2
            id={titleId}
            className="text-lg font-semibold text-neutral-900"
          >
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="text-sm text-neutral-700"
            >
              {description}
            </p>
          )}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
