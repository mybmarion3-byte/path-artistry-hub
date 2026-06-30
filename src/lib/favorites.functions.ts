import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("pro_id, pros:pro_id(*)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return data ?? [];
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ pro_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing, error: existingError } = await context.supabase
      .from("favorites")
      .select("pro_id")
      .eq("user_id", context.userId)
      .eq("pro_id", data.pro_id)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing) {
      const { error } = await context.supabase
        .from("favorites")
        .delete()
        .eq("user_id", context.userId)
        .eq("pro_id", data.pro_id);

      if (error) throw new Error(error.message);

      return { favorited: false };
    }

    const { error } = await context.supabase
      .from("favorites")
      .insert({ user_id: context.userId, pro_id: data.pro_id });

    if (error) throw new Error(error.message);

    return { favorited: true };
  });
