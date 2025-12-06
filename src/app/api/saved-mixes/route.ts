import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SavedMix } from "@/lib/savedMixes";
import type { UserPosition } from "@/lib/exposureEngine";

type SaveMixPayload = {
  name?: string;
  positions?: UserPosition[];
};

function requireEnv(key: "SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable`);
  }

  return value;
}

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

function getBearerToken(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, value] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return null;
  }

  return value.trim();
}

function createSupabaseClientWithToken(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export const runtime = "nodejs";

async function getAuthenticatedSupabaseClient(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const supabase = createSupabaseClientWithToken(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("[saved-mixes] auth error", error);
    return null;
  }

  return { supabase, user };
}

export async function POST(req: NextRequest) {
  const authenticated = await getAuthenticatedSupabaseClient(req);
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { supabase, user } = authenticated;

  let payload: SaveMixPayload = {};
  try {
    payload = (await req.json()) as SaveMixPayload;
  } catch {
    payload = {};
  }

  const positions = Array.isArray(payload.positions)
    ? payload.positions
    : [];

  if (!positions.length) {
    return NextResponse.json(
      { ok: false, error: "Positions are required" },
      { status: 400 },
    );
  }

  const mixName = payload.name?.trim() || "My saved mix";

  const { data: savedMix, error: insertError } = await supabase
    .from("saved_mixes")
    .insert({
      user_id: user.id,
      name: mixName,
      positions,
    })
    .select("id,name,positions,created_at,updated_at")
    .single();

  if (insertError) {
    console.error("[saved-mixes] insert error", insertError);
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, mix: savedMix });
}

export async function GET(req: NextRequest) {
  const authenticated = await getAuthenticatedSupabaseClient(req);
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { supabase, user } = authenticated;

  const { data: mixesData, error: fetchError } = await supabase
    .from("saved_mixes")
    .select("id,name,positions,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (fetchError) {
    console.error("[saved-mixes] fetch error", fetchError);
    return NextResponse.json(
      { ok: false, error: fetchError.message },
      { status: 500 },
    );
  }

  const mixes = (mixesData ?? []) as SavedMix[];

  return NextResponse.json({ ok: true, mixes });
}
