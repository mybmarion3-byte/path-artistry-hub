import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export type ProLocation = {
  id: string;
  name: string;
  type: "home" | "salon" | "coworking" | "video";
  address: string;
  city: string;
  postal_code: string;
  is_private: boolean;
  is_primary: boolean;
  active: boolean;
  travel_radius_km: number;
  travel_time_max_min: number;
  travel_fee_type: string;
  travel_fee_free_until_km: number;
  travel_fee_per_km: number;
  travel_fee_fixed: number;
};

export function useProLocations(proId?: string | null) {
  const [locations, setLocations] = useState<ProLocation[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!proId || !isSupabaseConfigured) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await (supabase as any)
        .from("pro_locations")
        .select("*")
        .eq("pro_id", proId)
        .eq("active", true)
        .order("is_primary", { ascending: false })
        .order("name");

      if (error) {
        console.error("[Supabase] Unable to load professional locations.", error);
      } else {
        setLocations((data ?? []) as ProLocation[]);
      }
    } catch (cause) {
      console.error("[Supabase] Unable to load professional locations.", cause);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [proId]);

  function requireDatabase() {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n’est pas connecté à cet aperçu.");
    }
  }

  async function createLocation(
    location: Omit<ProLocation, "id">
  ) {
    requireDatabase();
    if (!proId) {
      throw new Error("Fiche professionnelle introuvable.");
    }

    const { error } = await (supabase as any)
      .from("pro_locations")
      .insert({
        pro_id: proId,
        ...location,
      });

    if (error) throw error;

    await load();
  }

  async function updateLocation(
    id: string,
    values: Partial<ProLocation>
  ) {
    requireDatabase();

    const { error } = await (supabase as any)
      .from("pro_locations")
      .update(values)
      .eq("id", id);

    if (error) throw error;

    await load();
  }

  async function deleteLocation(id: string) {
    requireDatabase();

    const { error } = await (supabase as any)
      .from("pro_locations")
      .update({
        active: false,
      })
      .eq("id", id);

    if (error) throw error;

    await load();
  }

  return {
    locations,
    loading,
    createLocation,
    updateLocation,
    deleteLocation,
    refresh: load,
  };
}
