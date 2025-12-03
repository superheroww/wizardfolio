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
      <body className="min-h-screen bg-[--color-background] text-[--color-foreground] antialiased font-sans">
        <PostHogProvider>
          <div className="flex min-h-screen flex-col bg-[--color-background]">
            <header className="border-b border-[--color-border-subtle] bg-[--color-muted]">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <div className="text-base font-semibold tracking-tight text-[--text-primary]">
                  WizardFolio
                </div>
                <a
                  href="/analyze"
                  className="text-sm font-medium text-[--text-secondary] transition hover:text-[--text-primary]"
                >
                  Analyze
                </a>
              </div>
            </header>
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 xl:max-w-6xl">
              <main className="flex-1 space-y-4 bg-[--color-background]">{children}</main>
              <footer className="mt-6 border-t border-[--color-border-subtle] pt-3 text-xs text-[--color-text-muted]">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Built as a simple ETF look-through visualizer. For educational purposes only.</span>
                  <a
                    href="/faq"
                    className="text-xs text-[--color-text-muted] hover:text-[--color-foreground]"
                  >
                    FAQ
                  </a>
                </div>
              </footer>
            </div>
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}
