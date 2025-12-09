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
 * - Returns null if there's no token or it's invalid (including 401, 403, expired, user_not_found).
 * - Never throws. Only logs truly unexpected errors (network, unrecognized API errors).
 */
export async function getOptionalUserFromRequest(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const supabase = createSupabaseClientWithToken(token);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Expected auth failures: invalid token, expired token, user not found, etc.
    // These are normal for anonymous requests and should not be logged.
    if (error) {
      const status = (error as any).status;
      const code = (error as any).code;

      // Known auth-related error codes that are expected
      const isExpectedAuthError =
        status === 401 ||
        status === 403 ||
        code === "user_not_found" ||
        code === "invalid_jwt" ||
        code === "expired_token";

      if (!isExpectedAuthError) {
        // Only log truly unexpected errors
        console.error("[auth] getOptionalUserFromRequest unexpected error", {
          message: error.message,
          status,
          code,
        });
      }

      return null;
    }

    return user ?? null;
  } catch (err) {
    // Network errors or other unexpected exceptions
    const e = err as Error;
    console.error("[auth] getOptionalUserFromRequest unexpected error", {
      message: e.message,
      name: e.name,
    });
    return null;
  }
}
