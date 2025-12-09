import { NextRequest } from "next/server";
import { createSupabaseClientWithToken } from "@/lib/supabase";

export function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");
  if (!authorization) return null;

  const [scheme, value] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;

  return value.trim();
}

export { createSupabaseClientWithToken } from "@/lib/supabase";

/**
 * Best-effort user lookup from a NextRequest.
 * - Returns the Supabase user object if there's a valid Bearer token.
 * - Returns null if there's no token or it's invalid.
 * - Never throws and never sends a response by itself.
 */
export async function getOptionalUserFromRequest(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabase = createSupabaseClientWithToken(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("[auth] getOptionalUserFromRequest error", error);
    return null;
  }

  return user;
}
