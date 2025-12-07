"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { usePostHogSafe } from "@/lib/usePostHogSafe";
import { signOut } from "@/lib/supabaseBrowser";

export function Header() {
  const user = useSupabaseUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { capture } = usePostHogSafe();

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

  const handleCompareNavClick = () => {
    setMenuOpen(false);
    capture("compare_nav_clicked");
  };

  return (
    <>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-900">
              WizardFolio
            </span>
            <span className="text-[11px] text-neutral-500">
              ETF look-through &amp; mix analyzer
            </span>
          </Link>
          <div ref={menuRef} className="relative flex items-center gap-3">
            <nav className="hidden items-center gap-3 md:flex">
              <Link
                href="/compare"
                onClick={handleCompareNavClick}
                className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
              >
                Compare ETFs
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="text-xs font-medium text-neutral-700 transition hover:text-neutral-900 md:text-sm"
                >
                  Dashboard
                </Link>
              )}
              {user ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-300"
                >
                  {initials}
                  <span className="sr-only">Open account menu</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthDialogOpen(true)}
                  className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                >
                  Sign in
                </button>
              )}
            </nav>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 md:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4 text-neutral-700" />
            </button>
            {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
                <Link
                  href="/compare"
                  onClick={handleCompareNavClick}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Compare ETFs
                </Link>
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={handleNewMix}
                      className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      New mix
                    </button>
                    <Link
                      href="/dashboard"
                      className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full border-t border-neutral-100 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setAuthDialogOpen(true);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    Sign in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
