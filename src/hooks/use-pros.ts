import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROS as MOCK_PROS, type Pro, type Mode } from "@/lib/booker-store";
import camilleImg from "@/assets/pro-camille.jpg";
import thomasImg from "@/assets/pro-thomas.jpg";
import julieImg from "@/assets/pro-julie.jpg";
import nicolasImg from "@/assets/pro-nicolas.jpg";
import lauraImg from "@/assets/pro-laura.jpg";

const AVATAR_BY_SLUG: Record<string, string> = {
  camille: camilleImg,
  thomas: thomasImg,
  julie: julieImg,
  nicolas: nicolasImg,
  laura: lauraImg,
};

type ProRow = {
  id: string;
  slug: string;
  name: string;
  job: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialty: string | null;
  category: string | null;
  experience_years: number | null;
  rating: number | string | null;
  reviews_count: number | null;
  distance_km: number | string | null;
  availability: string | null;
  starting_price: number | string | null;
  verified: boolean | null;
  at_home: boolean | null;
  modes: string[] | null;
  map_x: number | null;
  map_y: number | null;
  pro_services?: {
    id: string;
    slug: string;
    name: string;
    duration_min: number;
    price: number | string;
    active: boolean;
    position: number | null;
  }[];
};

function rowToPro(row: ProRow): Pro {
  const services = (row.pro_services ?? [])
    .filter((s) => s.active)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((s) => ({
      id: s.slug,
      name: s.name,
      duration: s.duration_min,
      price: Number(s.price),
    }));

  return {
    id: row.slug,
    name: row.name,
    job: row.job ?? "",
    avatar: row.avatar_url || AVATAR_BY_SLUG[row.slug] || camilleImg,
    rating: Number(row.rating ?? 0),
    reviews: row.reviews_count ?? 0,
    distanceKm: Number(row.distance_km ?? 0),
    availability: row.availability ?? "now",
    price: Number(row.starting_price ?? (services[0]?.price ?? 0)),
    bio: row.bio ?? "",
    verified: !!row.verified,
    atHome: !!row.at_home,
    specialty: row.specialty ?? "",
    experience: row.experience_years ?? 0,
    x: row.map_x ?? 50,
    y: row.map_y ?? 50,
    category: row.category ?? "",
    services,
    modes: ((row.modes ?? ["home"]) as Mode[]),
  };
}

export function usePros() {
  const [pros, setPros] = useState<Pro[]>(MOCK_PROS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("pros")
        .select("*, pro_services(*)")
        .order("rating", { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const mapped = (data as unknown as ProRow[]).map(rowToPro);
      if (mapped.length > 0) setPros(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { pros, loading, error };
}
