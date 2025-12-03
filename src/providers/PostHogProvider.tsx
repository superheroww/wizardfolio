"use client";

import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";

export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(posthog as any).__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: false,
        },
      });
      (posthog as any).__loaded = true;
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      posthog.capture("$pageleave", {
        $current_url: window.location.href,
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    posthog.capture("$pageleave", { $current_url: window.location.href });
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
