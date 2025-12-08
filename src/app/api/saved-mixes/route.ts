import { NextRequest, NextResponse } from "next/server";
import {
  getOptionalUserFromRequest,
  getBearerToken,
  createSupabaseClientWithToken,
} from "@/lib/serverAuth";
import {
  DEFAULT_SAVED_MIX_NAME,
  SAVED_MIX_NAME_ERROR_MESSAGE,
  SAVED_MIX_NAME_MAX_LENGTH,
  SAVED_MIX_NAME_REQUIRED_MESSAGE,
  type SavedMix,
} from "@/lib/savedMixes";
import type { UserPosition } from "@/lib/exposureEngine";

type SaveMixPayload = {
  name?: string;
  positions?: UserPosition[];
};

type PatchSavedMixPayload = {
  id?: string;
  name?: string;
};

type DeleteSavedMixPayload = {
  id?: string;
};



type ValidateMixNameOptions = {
  allowFallback?: boolean;
};

function validateMixName(
  name?: string | null,
  options: ValidateMixNameOptions = {},
) {
  const trimmed =
    typeof name === "string" ? name.trim() : undefined;

  if (typeof name === "string") {
    if (!trimmed) {
      return { error: SAVED_MIX_NAME_REQUIRED_MESSAGE };
    }

    if (trimmed.length > SAVED_MIX_NAME_MAX_LENGTH) {
      return { error: SAVED_MIX_NAME_ERROR_MESSAGE };
    }

    return { value: trimmed };
  }

  if (options.allowFallback) {
    return { value: DEFAULT_SAVED_MIX_NAME };
  }

  return { error: SAVED_MIX_NAME_REQUIRED_MESSAGE };
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

  const nameValidation = validateMixName(payload.name ?? null, {
    allowFallback: true,
  });
  if (nameValidation.error) {
    return NextResponse.json(
      { ok: false, error: nameValidation.error },
      { status: 400 },
    );
  }

  const mixName = nameValidation.value;

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

export async function PATCH(req: NextRequest) {
  const authenticated = await getAuthenticatedSupabaseClient(req);
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { supabase, user } = authenticated;

  let payload: PatchSavedMixPayload = {};
  try {
    payload = (await req.json()) as PatchSavedMixPayload;
  } catch {
    payload = {};
  }

  const mixId = payload.id?.trim();
  if (!mixId) {
    return NextResponse.json(
      { ok: false, error: "Invalid mix id" },
      { status: 400 },
    );
  }

  if (typeof payload.name !== "string") {
    return NextResponse.json(
      { ok: false, error: "A name is required" },
      { status: 400 },
    );
  }

  const nameValidation = validateMixName(payload.name);
  if (nameValidation.error) {
    return NextResponse.json(
      { ok: false, error: nameValidation.error },
      { status: 400 },
    );
  }

  const { data: updatedMix, error: updateError } = await supabase
    .from("saved_mixes")
    .update({ name: nameValidation.value })
    .eq("id", mixId)
    .eq("user_id", user.id)
    .select("id,name,positions,created_at,updated_at")
    .single();

  if (updateError || !updatedMix) {
    console.error("[saved-mixes] update error", updateError);
    return NextResponse.json(
      {
        ok: false,
        error: (updateError ?? new Error("Unable to rename mix")).message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, mix: updatedMix });
}

export async function DELETE(req: NextRequest) {
  const authenticated = await getAuthenticatedSupabaseClient(req);
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { supabase, user } = authenticated;

  let payload: DeleteSavedMixPayload = {};
  try {
    payload = (await req.json()) as DeleteSavedMixPayload;
  } catch {
    payload = {};
  }

  const mixId = payload.id?.trim();
  if (!mixId) {
    return NextResponse.json(
      { ok: false, error: "Invalid mix id" },
      { status: 400 },
    );
  }

  const { error: deleteError } = await supabase
    .from("saved_mixes")
    .delete()
    .eq("id", mixId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[saved-mixes] delete error", deleteError);
    return NextResponse.json(
      { ok: false, error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
