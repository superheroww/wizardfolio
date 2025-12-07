"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type SupabaseAuthState = {
  user: User | null;
  isLoading: boolean;
};

export function useSupabaseAuthState(): SupabaseAuthState {
  const [{ user, isLoading }, setState] = useState<SupabaseAuthState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    let isActive = true;

    const supabase = getSupabaseBrowserClient();

    const update = (nextUser: User | null) => {
      if (!isActive) {
        return;
      }

      setState({
        user: nextUser,
        isLoading: false,
      });
    };

    supabase.auth
      .getSession()
      .then(({ data }) => {
        update(data.session?.user ?? null);
      })
      .catch(() => {
        update(null);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        update(session?.user ?? null);
      },
    );

    return () => {
      isActive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}

export function useSupabaseUser() {
  const { user } = useSupabaseAuthState();
  return user;
}
