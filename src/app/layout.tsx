import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "@/providers/PostHogProvider";

export const metadata: Metadata = {
  title: "WizardFolio. Portfolio Look-Through",
  description: "See what you really own inside your ETFs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 font-sans">
        <PostHogProvider>
          <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  WizardFolio Portfolio Look-Through
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Type your ETF and stock mix as percentages and see your true
                  exposure.
                </p>
              </div>
            </header>
            <main className="flex-1 space-y-4">{children}</main>
            <footer className="mt-6 border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Built as a simple ETF look-through visualizer. For educational purposes only.
            </footer>
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}
