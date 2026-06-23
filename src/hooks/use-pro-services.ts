import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProServiceRow = Database["public"]["Tables"]["pro_services"]["Row"];

export type ProService = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export type ProServiceDraft = Omit<ProService, "id">;

function toService(row: ProServiceRow): ProService {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration_min,
    price: Number(row.price),
  };
}

function makeSlug(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "prestation"}-${Date.now()}`;
}

export function useProServices(proId: string | null | undefined) {
  const [rows, setRows] = useState<ProServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const services = useMemo(() => rows.map(toService), [rows]);

  async function load() {
    if (!proId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("pro_services")
      .select("*")
      .eq("pro_id", proId)
      .eq("active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (loadError) {
      setRows([]);
      setError(loadError.message);
    } else {
      setRows(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [proId]);

  async function createService(draft: ProServiceDraft) {
    if (!proId) throw new Error("Fiche professionnelle introuvable.");

    setSaving(true);
    setError(null);

    const { error: createError } = await supabase.from("pro_services").insert({
      pro_id: proId,
      slug: makeSlug(draft.name),
      name: draft.name.trim(),
      duration_min: draft.duration,
      price: draft.price,
      active: true,
      position: rows.length,
    });

    setSaving(false);
    if (createError) {
      setError(createError.message);
      throw createError;
    }

    await load();
  }

  async function updateService(id: string, draft: ProServiceDraft) {
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("pro_services")
      .update({
        name: draft.name.trim(),
        duration_min: draft.duration,
        price: draft.price,
      })
      .eq("id", id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      throw updateError;
    }

    await load();
  }

  async function disableService(id: string) {
    setSaving(true);
    setError(null);

    const { error: disableError } = await supabase.from("pro_services").update({ active: false }).eq("id", id);

    setSaving(false);
    if (disableError) {
      setError(disableError.message);
      throw disableError;
    }

    await load();
  }

  return {
    services,
    loading,
    saving,
    error,
    createService,
    updateService,
    disableService,
  };
}
