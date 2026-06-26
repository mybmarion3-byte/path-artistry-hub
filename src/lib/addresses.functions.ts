import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const addressInput = z.object({
  label: z.string().min(1),
  kind: z.enum(["home", "hotel", "office", "custom"]),
  address: z.string().min(3),
  is_primary: z.boolean().optional().default(false),
});

export const listMyAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("client_addresses")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => addressInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.is_primary) {
      await context.supabase
        .from("client_addresses")
        .update({ is_primary: false })
        .eq("user_id", context.userId);
    }
    const { data: row, error } = await context.supabase
      .from("client_addresses")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("client_addresses")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPrimaryAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("client_addresses")
      .update({ is_primary: false })
      .eq("user_id", context.userId);
    const { error } = await context.supabase
      .from("client_addresses")
      .update({ is_primary: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
