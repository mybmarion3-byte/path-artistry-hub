import { supabase } from "@/lib/supabase";
import { type Pro, type Mode } from "@/lib/booker-store";
import camilleImg from "@/assets/pro-camille.jpg";
import julieImg from "@/assets/pro-julie.jpg";

type ServiceRow = {
  id: string;
  name: string;
  duration_min?: number | null;
  duration?: number | null;
  price: number | null;
};

type ProfessionalRow = {
  id: string;
  name: string;
  job: string | null;
  category: string | null;
  bio: string | null;
  avatar_url: string | null;
  rating: number | null;
  reviews: number | null;
  distance_km: number | null;
  availability: string | null;
  starting_price: number | null;
  price: number | null;
  verified: boolean | null;
  at_home: boolean | null;
  specialty: string | null;
  experience: number | null;
  x: number | null;
  y: number | null;
  modes: Mode[] | null;
  pro_services?: ServiceRow[];
};

const AVATAR_BY_NAME: Record<string, string> = {
  "Camille Bernard": camilleImg,
  "Julie Lemoine": julieImg,
};

export function isSupabaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

function rowToPro(row: ProfessionalRow): Pro {
  const services = (row.pro_services ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    duration: Number(service.duration_min ?? service.duration ?? 0),
    price: Number(service.price ?? 0),
  }));

  return {
    id: row.id,
    name: row.name,
    job: row.job ?? "",
    avatar: row.avatar_url || AVATAR_BY_NAME[row.name] || camilleImg,
    rating: Number(row.rating ?? 0),
    reviews: row.reviews ?? 0,
    distanceKm: Number(row.distance_km ?? 0),
    availability: row.availability ?? "now",
    price: Number(row.starting_price ?? row.price ?? services[0]?.price ?? 0),
    bio: row.bio ?? "",
    verified: !!row.verified,
    atHome: !!row.at_home,
    specialty: row.specialty ?? "",
    experience: row.experience ?? 0,
    x: Number(row.x ?? 50),
    y: Number(row.y ?? 50),
    category: row.category ?? "",
    services,
    modes: row.modes ?? (["home"] as Mode[]),
  };
}

export async function fetchProfessionals(): Promise<{
  pros: Pro[];
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { pros: [], error: null };
  }

  const { data, error } = await supabase
    .from("pros")
    .select("*, pro_services(*)")
    .order("rating", { ascending: false });

  if (error) {
    return { pros: [], error: error.message };
  }

  const pros = ((data ?? []) as ProfessionalRow[]).map(rowToPro);

  return { pros, error: null };
}
