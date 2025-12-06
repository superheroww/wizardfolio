import { createClient } from "@supabase/supabase-js";

function requireServerEnv(key: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable`);
  }

  return value;
}

export function createServerSupabaseClient() {
  const supabaseUrl = requireServerEnv("SUPABASE_URL");
  const serviceRoleKey = requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
