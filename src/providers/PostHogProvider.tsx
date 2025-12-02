"use client";

// npm install posthog-js
import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";

type PostHogProviderProps = {
  children: ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
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

  return <>{children}</>;
}
