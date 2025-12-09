"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isActive = true;

    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!isActive) return;
        setUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (isActive) {
          setUser(null);
        }
      });

    const { data: listener } = getSupabaseBrowserClient().auth.onAuthStateChange(
      (_event, session) => {
        if (!isActive) return;
        setUser(session?.user ?? null);
      },
    );

    return () => {
      isActive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return user;
}
