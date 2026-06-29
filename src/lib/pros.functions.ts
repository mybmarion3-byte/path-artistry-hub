import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [
      ...(!supabaseUrl ? ["SUPABASE_URL"] : []),
      ...(!supabaseAnonKey ? ["SUPABASE_ANON_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}`);
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listPros = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("pros")
    .select("*, pro_services(*)")
    .not("user_id", "is", null)
    .order("rating", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProBySlug = createServerFn({ method: "GET" })
  .validator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: pro, error } = await supabase
      .from("pros")
      .select("*, pro_services(*)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return pro;
  });

export const listProServices = createServerFn({ method: "GET" })
  .validator((d) => z.object({ proId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("pro_services")
      .select("*")
      .eq("pro_id", data.proId)
      .eq("active", true)
      .order("position");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
