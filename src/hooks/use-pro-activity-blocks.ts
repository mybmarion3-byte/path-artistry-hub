import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ActivityBlockRow =
  Database["public"]["Tables"]["pro_activity_blocks"]["Row"];

export type ActivityBlock = {
  id: string;
  proId: string;
  locationId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
  active: boolean;
};

export type ActivityBlockDraft = {
  locationId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label?: string | null;
};

function toActivityBlock(row: ActivityBlockRow): ActivityBlock {
  return {
    id: row.id,
    proId: row.pro_id,
    locationId: row.location_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    label: row.label,
    active: row.active,
  };
}

function validateDraft(draft: ActivityBlockDraft) {
  if (draft.dayOfWeek < 1 || draft.dayOfWeek > 7) {
    throw new Error("Jour invalide.");
  }

  if (!draft.startTime || !draft.endTime) {
    throw new Error("Les horaires sont obligatoires.");
  }

  if (draft.endTime <= draft.startTime) {
    throw new Error("L’heure de fin doit être après l’heure de début.");
  }
}

export function useProActivityBlocks(proId: string | null | undefined) {
  const [rows, setRows] = useState<ActivityBlockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocks = useMemo(() => rows.map(toActivityBlock), [rows]);

  const load = useCallback(async () => {
    if (!proId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("pro_activity_blocks")
      .select("*")
      .eq("pro_id", proId)
      .eq("active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (loadError) {
      setRows([]);
      setError(loadError.message);
    } else {
      setRows(data ?? []);
    }

    setLoading(false);
  }, [proId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createBlock(draft: ActivityBlockDraft) {
    if (!proId) {
      throw new Error("Fiche professionnelle introuvable.");
    }

    validateDraft(draft);
    setSaving(true);
    setError(null);

    const { error: createError } = await supabase
      .from("pro_activity_blocks")
      .insert({
        pro_id: proId,
        location_id: draft.locationId,
        day_of_week: draft.dayOfWeek,
        start_time: draft.startTime,
        end_time: draft.endTime,
        label: draft.label ?? null,
        active: true,
      });

    setSaving(false);

    if (createError) {
      setError(createError.message);
      throw createError;
    }

    await load();
  }

  async function updateBlock(id: string, draft: ActivityBlockDraft) {
    validateDraft(draft);
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("pro_activity_blocks")
      .update({
        location_id: draft.locationId,
        day_of_week: draft.dayOfWeek,
        start_time: draft.startTime,
        end_time: draft.endTime,
        label: draft.label ?? null,
      })
      .eq("id", id)
      .eq("pro_id", proId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      throw updateError;
    }

    await load();
  }

  async function disableBlock(id: string) {
    setSaving(true);
    setError(null);

    const { error: disableError } = await supabase
      .from("pro_activity_blocks")
      .update({ active: false })
      .eq("id", id)
      .eq("pro_id", proId);

    setSaving(false);

    if (disableError) {
      setError(disableError.message);
      throw disableError;
    }

    await load();
  }

  return {
    blocks,
    loading,
    saving,
    error,
    reload: load,
    createBlock,
    updateBlock,
    disableBlock,
  };
}