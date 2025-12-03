"use client";

import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Init PostHog
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false,
        autocapture: true,
      });
    }
  }, []);

  // Track pageleave on tab close / reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      posthog.capture("$pageleave", {
        $current_url: window.location.href,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Track SPA navigation: $pageleave then $pageview
  useEffect(() => {
    if (!pathname) return;

    // Previous page leave
    posthog.capture("$pageleave", {
      $current_url: window.location.href,
    });

    // New page view
    posthog.capture("$pageview", {
      $current_url: window.location.href,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}