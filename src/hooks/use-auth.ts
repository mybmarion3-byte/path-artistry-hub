import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getPrimaryAuthRole, type AuthRole } from "@/lib/auth-roles";

export type AuthState = {
  user: User | null;
  session: Session | null;
  role: AuthRole;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, role: "client", loading: true });

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      setState({ user, session, role: getPrimaryAuthRole(user), loading: false });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      setState({ user, session: data.session, role: getPrimaryAuthRole(user), loading: false });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
