"use client";

import { useState } from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";

type AuthPromptProps = {
  description?: string;
};

export function AuthPrompt({ description }: AuthPromptProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Sign in to your dashboard
      </p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {description ??
          "Save mixes, revisit them later, and build your personalized ETF exposure over time."}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center justify-center rounded-2xl border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-zinc-900"
      >
        Sign in
      </button>
      <AuthDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
