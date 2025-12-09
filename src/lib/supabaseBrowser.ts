/**
 * @deprecated This module is deprecated. Import from @/lib/supabase instead.
 * This file now serves as a compatibility layer re-exporting auth helpers.
 */

export { getSupabaseBrowserClient } from "./supabase";

import { getSupabaseBrowserClient } from "./supabase";

export function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signUp({
    email,
    password,
  });
}

export function signOut() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}

export async function sendMagicLink(email: string) {
  const supabase = getSupabaseBrowserClient();

  if (typeof window === "undefined") {
    return {
      data: null,
      error: new Error("Magic link can only be sent from the browser."),
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const redirectTo =
    process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

  return supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${redirectTo}/`,
    },
  });
}
