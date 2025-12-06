import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { SavedMix } from "@/lib/savedMixes";
import type { UserPosition } from "@/lib/exposureEngine";
import {
  createServerClient,
  type CookieMethodsServer,
} from "@supabase/auth-helpers-nextjs";

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

async function createAuthenticatedSupabaseClient() {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);

  const headerEntries = [...headerStore.entries()];
  const headerObject = headerEntries.reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value }),
    {} as Record<string, string>,
  );

  const cookieMethods: CookieMethodsServer = {
    getAll: () => {
      const items = cookieStore.getAll();
      if (!items || !items.length) {
        return null;
      }

      return items.map((item) => ({
        name: item.name,
        value: item.value,
      }));
    },
    setAll: (values) => {
      for (const entry of values) {
        const { name, value, options } = entry;
        cookieStore.set({
          name,
          value,
          domain: options?.domain,
          expires: options?.expires,
          httpOnly: options?.httpOnly ?? true,
          maxAge: options?.maxAge,
          path: options?.path,
          sameSite: options?.sameSite,
          secure: options?.secure,
        });
      }
    },
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: headerObject,
    },
    cookies: {
      getAll: cookieMethods.getAll,
      setAll: cookieMethods.setAll,
    },
  });
}

async function getAuthenticatedUser() {
  const supabase = await createAuthenticatedSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user, error };
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { supabase, user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    console.error("[saved-mixes] auth error", userError);
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

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

export async function GET() {
  const { supabase, user, error: userError } = await getAuthenticatedUser();

  if (userError || !user) {
    console.error("[saved-mixes] auth error", userError);
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data: mixesData, error: fetchError } = await supabase
    .from("saved_mixes")
    .select("id,name,positions,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const mixes = (mixesData ?? []) as SavedMix[];

  if (fetchError) {
    console.error("[saved-mixes] fetch error", fetchError);
    return NextResponse.json(
      { ok: false, error: fetchError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, mixes: mixes ?? [] });
}
