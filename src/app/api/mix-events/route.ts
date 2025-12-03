import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type MixEventPosition = { symbol: string; weightPct: number };

type MixEventPayload = {
  positions?: MixEventPosition[];
  benchmarkSymbol?: string | null;
  source?: string | null;
  templateKey?: string | null;
  referrer?: string | null;
};

export const runtime = "nodejs";

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
        { ok: false, error: "No positions" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("mix_events").insert({
      positions: body.positions,
      benchmark_symbol: body.benchmarkSymbol ?? null,
      source: body.source ?? null,
      template_key: body.templateKey ?? null,
      referrer: body.referrer ?? null,
    });

    if (error) {
      console.error("[mix_events] insert error", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mix_events] unexpected error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
