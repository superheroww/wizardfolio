import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
      <body className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
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
              <Header />
              <main className="flex-1">
                <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
