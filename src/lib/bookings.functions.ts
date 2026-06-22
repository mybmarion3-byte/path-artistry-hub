import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createInput = z.object({
  pro_slug: z.string(),
  service_slug: z.string().optional(),
  address_id: z.string().uuid().optional(),
  address_text: z.string().optional(),
  mode: z.enum(["home", "studio", "video"]),
  start_at: z.string(),
  duration_min: z.number().int().positive(),
  phone: z.string().optional(),
  digicode: z.string().optional(),
  comments: z.string().optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => createInput.parse(d))
  .handler(async ({ data, context }) => {
    const start = new Date(data.start_at);
    if (Number.isNaN(start.getTime())) throw new Error("Date invalide");
    if (start.getTime() < Date.now() - 60_000) throw new Error("Le créneau doit être dans le futur");
    const end = new Date(start.getTime() + data.duration_min * 60_000);

    const { data: pro, error: proErr } = await context.supabase
      .from("pros")
      .select("id, name, modes, starting_price")
      .eq("slug", data.pro_slug)
      .maybeSingle();
    if (proErr) throw new Error(proErr.message);
    if (!pro) throw new Error("Pro introuvable");
    if (!pro.modes.includes(data.mode)) throw new Error("Ce mode n'est pas proposé par ce pro");

    let serviceName = "Prestation";
    let price = Number(pro.starting_price);
    let serviceId: string | null = null;
    if (data.service_slug) {
      const { data: svc, error: svcErr } = await context.supabase
        .from("pro_services")
        .select("id, name, price, duration_min, pro_id")
        .eq("pro_id", pro.id)
        .eq("slug", data.service_slug)
        .maybeSingle();
      if (svcErr) throw new Error(svcErr.message);
      if (!svc) throw new Error("Prestation invalide");
      serviceId = svc.id;
      serviceName = svc.name;
      price = Number(svc.price);
    }

    // Conflict check: any pending/confirmed booking overlapping
    const { data: conflicts, error: confErr } = await context.supabase
      .from("bookings")
      .select("id")
      .eq("pro_id", pro.id)
      .in("status", ["pending", "confirmed"])
      .lt("start_at", end.toISOString())
      .gt("end_at", start.toISOString())
      .limit(1);
    if (confErr) throw new Error(confErr.message);
    if (conflicts && conflicts.length > 0) {
      throw new Error("Ce créneau n'est plus disponible");
    }

    const { data: booking, error } = await context.supabase
      .from("bookings")
      .insert({
        client_id: context.userId,
        pro_id: pro.id,
        service_id: serviceId,
        service_name: serviceName,
        address_id: data.address_id ?? null,
        address_text: data.address_text ?? null,
        mode: data.mode,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        price,
        status: "pending",
        phone: data.phone,
        digicode: data.digicode,
        comments: data.comments,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return booking;
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*, pros:pro_id(name, avatar_url, job, slug)")
      .eq("client_id", context.userId)
      .order("start_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listProBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: pro } = await context.supabase
      .from("pros")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!pro) return [];
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .eq("pro_id", pro.id)
      .order("start_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
