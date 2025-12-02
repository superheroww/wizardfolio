import { createClient } from "@supabase/supabase-js";

function getEnv(key: string): string {
  const value = process.env[key as keyof typeof process.env];
  if (!value) {
    throw new Error(`Missing ${key} environment variable`);
  }

  return value;
}

export function createServerSupabaseClient() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
