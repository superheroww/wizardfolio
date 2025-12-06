"use client";

import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-neutral-700">WizardFolio</span>
          <span className="text-[11px] text-neutral-400">
            © {year} WizardFolio. All rights reserved.
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-neutral-500">
          <Link href="/about" className="transition hover:text-neutral-900">
            About
          </Link>
          <Link href="/about" className="transition hover:text-neutral-900">
            Contact
          </Link>
          <Link href="/faq" className="transition hover:text-neutral-900">
            FAQ
          </Link>
          <Link href="/privacy" className="transition hover:text-neutral-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition hover:text-neutral-900">
            Terms of Use
          </Link>
        </nav>
      </div>
    </footer>
  );
}
