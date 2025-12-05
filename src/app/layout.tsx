import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { PostHogProvider } from "@/providers/PostHogProvider";

const SITE_TITLE = "WizardFolio – ETF Look-Through & Portfolio Analyzer";
const SITE_DESCRIPTION =
  "WizardFolio helps investors analyze ETF holdings, sector and country exposure, and build mixes instantly.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WizardFolio",
    url: "https://wizardfolio.com",
  };

  return (
    <html lang="en" className="h-full">
      <body className="bg-neutral-50 font-sans text-neutral-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
        <Suspense fallback={null}>
          <PostHogProvider>
            <div className="flex min-h-screen flex-col">
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-zinc-50">
                      WizardFolio Portfolio Look-Through
                    </h1>
                    <p className="text-xs text-neutral-500 dark:text-zinc-400">
                      Type your ETF and stock mix as percentages and see your true
                      exposure.
                    </p>
                  </div>
                </header>
                <main className="flex-1 space-y-4">{children}</main>
              </div>
              <Footer />
            </div>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
