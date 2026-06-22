import { useEffect, useMemo, useState } from "react";
import { getPro } from "@/lib/booker-store";
import { matchPros } from "@/lib/matching";

export function hashLocation(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function useLiveEta(location: string) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((current) => current + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const offsetKm = useMemo(() => {
    const hash = hashLocation(location || "");
    return ((hash % 36) / 10) - 1.0;
  }, [location]);

  return useMemo(() => {
    const minute = new Date().getMinutes();
    const jitter = (minute % 5) - 2;

    return (pro: { distanceKm: number }) => {
      const adjustedDistance = Math.max(0.2, pro.distanceKm + offsetKm);
      return Math.max(5, Math.round(adjustedDistance * 6 + 6 + jitter));
    };
  }, [offsetKm, tick]);
}

export function useBookerSlots(proId: string) {
  return useMemo(() => {
    const pro = getPro(proId);
    return (
      matchPros({ query: "", when: { kind: "now" }, maxKm: 99, atHome: false }).find(
        (result) => result.pro.id === pro.id,
      )?.nextSlots ?? []
    );
  }, [proId]);
}
