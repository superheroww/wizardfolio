import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getOptionalUserFromRequest } from "@/lib/serverAuth";

type MixEventPosition = { symbol: string; weightPct: number };

type MixEventPayload = {
  positions?: MixEventPosition[];
  benchmarkSymbol?: string | null;
  source?: string | null;
  templateKey?: string | null;
  referrer?: string | null;
  anonId?: string | null;
};

export const runtime = "nodejs";
const INSERT_TIMEOUT_MS = 7000;

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    let body: MixEventPayload = {};

    if (text) {
      try {
        body = JSON.parse(text) as MixEventPayload;
      } catch {
        body = {};
      }
    }

    if (!body.positions || body.positions.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No positions", code: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    // Best-effort user lookup from Authorization: Bearer <token>
    const user = await getOptionalUserFromRequest(req);
    const userId = user?.id ?? null;

    // Country from Vercel's geo header (e.g., "CA", "US")
    const countryCode = req.headers.get("x-vercel-ip-country") ?? null;

    const supabase = getSupabaseAdminClient();

    // Best-effort insert logging: do not block or fail the request if it fails
    try {
      const { error } = await supabase.from("mix_events").insert({
        positions: body.positions,
        benchmark_symbol: body.benchmarkSymbol ?? null,
        source: body.source ?? null,
        template_key: body.templateKey ?? null,
        referrer: body.referrer ?? null,
        anon_id: body.anonId ?? null,
        user_id: userId,
        country_code: countryCode,
      });

      if (error) {
        console.error("[mix_events] Supabase insert error", {
          message: error.message,
          code: error.code,
        });
        // Best-effort: log but do not fail the request
      }
    } catch (err) {
      const e = err as Error;
      console.error("[mix_events] Network or unexpected error", {
        message: e.message,
        name: e.name,
      });
      // Best-effort: log but do not fail the request
    }

    // Always return success for valid payloads, regardless of logging outcome
    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as Error;
    console.error("[mix_events] Unexpected error", {
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    return NextResponse.json(
      { ok: false, error: "Internal error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
