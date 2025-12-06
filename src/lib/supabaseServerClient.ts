import {
  createServerClient,
  type CookieMethodsServer,
} from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";

function requireServerEnv(key: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable`);
  }

  return value;
}

const supabaseUrl = requireServerEnv("SUPABASE_URL");
const supabaseServiceRoleKey = requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");

export async function createSupabaseServerClient() {
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

  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: headerObject,
    },
    cookies: {
      getAll: cookieMethods.getAll,
      setAll: cookieMethods.setAll,
    },
  });
}
