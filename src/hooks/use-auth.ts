import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { getPrimaryAuthRole, type AuthRole } from "@/lib/auth-roles";

export type AuthState = {
  user: User | null;
  session: Session | null;
  role: AuthRole;
  loading: boolean;
};

const signedOutState: AuthState = {
  user: null,
  session: null,
  role: "client",
  loading: false,
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    ...signedOutState,
    loading: isSupabaseConfigured,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState(signedOutState);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        const user = session?.user ?? null;
        setState({ user, session, role: getPrimaryAuthRole(user), loading: false });
      });
      unsubscribe = () => sub.subscription.unsubscribe();

      void supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!mounted) return;
          const user = data.session?.user ?? null;
          setState({ user, session: data.session, role: getPrimaryAuthRole(user), loading: false });
        })
        .catch((error) => {
          console.error("[Supabase] Unable to restore the auth session.", error);
          if (mounted) setState(signedOutState);
        });
    } catch (error) {
      console.error("[Supabase] Unable to initialise authentication.", error);
      setState(signedOutState);
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return state;
}
