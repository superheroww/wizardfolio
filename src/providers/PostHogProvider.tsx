"use client";

import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

type PostHogProviderProps = {
  children: ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false, // keep FALSE!
        autocapture: true,
      });
    }
  }, []);

  // Track pageviews on route change
  useEffect(() => {
    if (!pathname) return;

    posthog.capture("$pageview", {
      $current_url: window.location.href,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}