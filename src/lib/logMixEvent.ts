// src/lib/logMixEvent.ts
import { getSupabaseBrowserClient } from "@/lib/supabase";

type MixEventPosition = { symbol: string; weightPct: number };

export type LogMixEventInput = {
  positions: MixEventPosition[];
  benchmarkSymbol?: string | null;
  source?: string | null;
  templateKey?: string | null;
  referrer?: string | null;
  anonId?: string | null;
};

export async function logMixEvent(input: LogMixEventInput) {
  if (!input.positions?.length) return;

  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch("/api/mix-events", {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[mix_events] API logging failed", {
        status: res.status,
        body,
      });
    }
  } catch (err) {
    console.error("[mix_events] API logging network error", err);
  }
}
