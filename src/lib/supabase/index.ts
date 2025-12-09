import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieMethodsServer } from "@supabase/auth-helpers-nextjs";

/**
 * Unified Supabase client factory module.
 * This is the single entrypoint for all Supabase client creation in the app.
 * Do not call createClient directly elsewhere in the codebase.
 */

// Browser client instance cache (singleton pattern)
let browserClientInstance: SupabaseClient | null = null;

/**
 * Get a Supabase client for browser (client-side) usage.
 * This client uses the public anon key and supports persistent sessions.
 * Use this in client components, client hooks, and browser environments.
 * Returns a cached instance to avoid creating multiple clients.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClientInstance) {
    return browserClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  browserClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClientInstance;
}

/**
 * Get a Supabase client for server-side usage with Row Level Security (RLS).
 * This client uses the public anon key (not the service role key) and integrates
 * with Next.js cookies and headers to maintain user context and RLS policies.
 * Use this in Server Components and API routes for user-respecting queries.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const { cookies: getCookies, headers: getHeaders } = await import("next/headers");
  
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const [headerStore, cookieStore] = await Promise.all([getHeaders(), getCookies()]);

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

      return items.map((item: any) => ({
        name: item.name,
        value: item.value,
      }));
    },
    setAll: (values: { name: string; value: string; options: any }[]) => {
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

/**
 * Get a Supabase client for admin operations using the service role key.
 * This client bypasses RLS and has full database access.
 * IMPORTANT: Only use this in truly backend-only operations (API routes, cron jobs).
 * NEVER expose this client to the browser or use it for user-facing operations.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase client with a custom bearer token for API route authentication.
 * This is useful for API routes that need to authenticate a user based on an Authorization header.
 * Use in conjunction with getBearerToken() from serverAuth helpers.
 */
export function createSupabaseClientWithToken(token: string): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
