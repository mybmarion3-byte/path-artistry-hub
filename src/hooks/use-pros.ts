import { useEffect, useState } from "react";
import { PROS as MOCK_PROS, type Pro } from "@/lib/booker-store";
import { fetchProfessionals, isSupabaseConfigured } from "@/lib/fetch-professionals";

export function usePros() {
  const [pros, setPros] = useState<Pro[]>(MOCK_PROS);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPros() {
      const { pros: livePros, error: fetchError } = await fetchProfessionals();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError);
      } else if (livePros.length > 0) {
        setPros(livePros);
      }

      setLoading(false);
    }

    loadPros();

    return () => {
      cancelled = true;
    };
  }, []);

  return { pros, loading, error };
}