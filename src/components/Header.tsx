"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { signOut } from "@/lib/supabaseBrowser";

export function Header() {
  const user = useSupabaseUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [user]);

  const initials =
    user?.email?.[0]?.toUpperCase() ??
    user?.user_metadata?.name?.[0]?.toUpperCase() ??
    "?";

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
  };

  const handleNewMix = () => {
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-50">
          WizardFolio Portfolio Look-Through
        </h1>
        <p className="text-xs text-neutral-500 dark:text-zinc-400">
          Type your ETF and stock mix as percentages and see your true exposure.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            Dashboard
          </Link>
        )}
        {user ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {initials}
              <span className="sr-only">Open account menu</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={handleNewMix}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  New mix
                </button>
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full border-t border-zinc-100 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAuthDialogOpen(true)}
            className="rounded-full border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-60"
          >
            Sign in
          </button>
        )}
      </div>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </header>
  );
}
