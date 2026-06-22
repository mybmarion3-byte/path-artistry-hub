import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: roles }, { data: pro }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.from("pros").select("id, slug, name").eq("user_id", context.userId).maybeSingle(),
    ]);
    return {
      userId: context.userId,
      profile,
      roles: (roles ?? []).map((r) => r.role),
      pro,
    };
  });
