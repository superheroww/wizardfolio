import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type FeatureGateTrackPayload = {
  featureKey?: string | null;
  source?: string | null;
  anonId?: string | null;
  mixA?: Record<string, unknown> | null;
  mixB?: Record<string, unknown> | null;
};

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const {
      featureKey,
      source,
      anonId,
      mixA,
      mixB,
    } = (await req.json()) as FeatureGateTrackPayload;

    if (!featureKey || !source) {
      return NextResponse.json(
        { error: "featureKey and source are required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("feature_gate_events").insert({
      feature_key: featureKey,
      source,
      anon_id: anonId ?? null,
      user_id: null,
      mix_a: mixA ?? null,
      mix_b: mixB ?? null,
    });

    if (error) {
      console.error("[feature_gate_events] insert error", error);
      return NextResponse.json(
        { error: "Failed to record event" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[feature-gates/track] unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 },
    );
  }
}
