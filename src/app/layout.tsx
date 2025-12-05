import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { PostHogProvider } from "@/providers/PostHogProvider";

export const metadata: Metadata = {
  title: "WizardFolio. Portfolio Look-Through",
  description: "See what you really own inside your ETFs.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "WizardFolio. Portfolio Look-Through",
    description: "See what you really own inside your ETFs.",
    url: "https://wizardfolio.com",
    siteName: "WizardFolio",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "WizardFolio portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WizardFolio. Portfolio Look-Through",
    description: "See what you really own inside your ETFs.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50 font-sans">
        <Suspense fallback={null}>
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
                <div className="flex flex-wrap items-center gap-3">
                  <span>Built as a simple ETF look-through visualizer. For educational purposes only.</span>
                  <a
                    href="/faq"
                    className="text-xs text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    FAQ
                  </a>
                </div>
              </footer>
            </div>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
