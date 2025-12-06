import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

const supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export function getSupabaseBrowserClient() {
  return supabaseBrowserClient;
}

export function signInWithEmail(email: string, password: string) {
  return supabaseBrowserClient.auth.signInWithPassword({
    email,
    password,
  });
}

export function signUpWithEmail(email: string, password: string) {
  return supabaseBrowserClient.auth.signUp({
    email,
    password,
  });
}

export function signOut() {
  return supabaseBrowserClient.auth.signOut();
}
