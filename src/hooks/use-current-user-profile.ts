import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPrimaryAuthRole, isAuthRole, type AuthRole } from "@/lib/auth-roles";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProProfile = Database["public"]["Tables"]["pros"]["Row"];

export type CurrentUserProfileState = {
  user: ReturnType<typeof useAuth>["user"];
  profile: Profile | null;
  role: AuthRole;
  pro: ProProfile | null;
  loading: boolean;
  error: string | null;
};

export function useCurrentUserProfile(): CurrentUserProfileState {
  const auth = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AuthRole>("client");
  const [pro, setPro] = useState<ProProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoadingProfile(true);
      setError(null);

      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const sessionUser = sessionData.session?.user ?? auth.user;

        if (!sessionUser) {
          if (!mounted) return;
          setProfile(null);
          setRole("client");
          setPro(null);
          setError("Aucune session utilisateur active.");
          return;
        }

        const userId = sessionUser.id;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          throw new Error(`Erreur profil : ${profileError.message}`);
        }

        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (rolesError) {
          throw new Error(`Erreur rôle : ${rolesError.message}`);
        }

        const dbRole = rolesData?.map((item) => item.role).find(isAuthRole);
        const nextRole = dbRole ?? getPrimaryAuthRole(sessionUser);

        let proData: ProProfile | null = null;

        if (nextRole === "pro" || nextRole === "admin") {
          const { data, error: proError } = await supabase
            .from("pros")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (proError) {
            throw new Error(`Erreur pro : ${proError.message}`);
          }

          proData = data ?? null;
        }

        if (!mounted) return;

        setProfile(profileData ?? null);
        setRole(nextRole);
        setPro(proData);
        setError(null);
      } catch (cause) {
        if (!mounted) return;

        setProfile(null);
        setRole(getPrimaryAuthRole(auth.user));
        setPro(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible de charger le profil utilisateur.",
        );
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    if (auth.loading) return;

    if (!auth.user) {
      setProfile(null);
      setRole("client");
      setPro(null);
      setError(null);
      setLoadingProfile(false);
      return;
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [auth.loading, auth.user]);

  return {
    user: auth.user,
    profile,
    role,
    pro,
    loading: auth.loading || loadingProfile,
    error,
  };
}