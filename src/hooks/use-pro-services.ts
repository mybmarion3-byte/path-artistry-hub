import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ServiceRow = Database["public"]["Tables"]["pro_services"]["Row"];

export type ProService = {
  id: string;
  categoryId: string | null;
  name: string;
  duration: number;
  price: number;
};

export type ProServiceCategory = {
  id: string;
  name: string;
  position: number;
  services: ProService[];
};

export type ProServiceDraft = {
  name: string;
  duration: number;
  price: number;
  categoryId: string | null;
};

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

function validateServiceDraft(draft: ProServiceDraft) {
  if (!draft.name.trim()) {
    throw new Error("Le nom de la prestation est obligatoire.");
  }

  if (!draft.categoryId) {
    throw new Error("Sélectionnez une catégorie.");
  }

  if (!Number.isFinite(draft.duration) || draft.duration <= 0) {
    throw new Error("La durée doit être supérieure à 0 minute.");
  }

  if (!Number.isFinite(draft.price) || draft.price < 0) {
    throw new Error("Le prix ne peut pas être négatif.");
  }
}

function toService(row: ServiceRow): ProService {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    duration: row.duration_min,
    price: Number(row.price),
  };
}

export function useProServices(proId: string | null | undefined) {
  const [categories, setCategories] = useState<ProServiceCategory[]>([]);
  const [services, setServices] = useState<ProService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const servicesByCategory = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      services: services.filter((service) => service.categoryId === category.id),
    }));
  }, [categories, services]);

  const load = useCallback(async () => {
    if (!proId) {
      setCategories([]);
      setServices([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const [categoriesResult, servicesResult] = await Promise.all([
      supabase
        .from("pro_service_categories")
        .select("id, name, position")
        .eq("pro_id", proId)
        .eq("active", true)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),

      supabase
        .from("pro_services")
        .select("*")
        .eq("pro_id", proId)
        .eq("active", true)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (categoriesResult.error) {
      setCategories([]);
      setServices([]);
      setError(categoriesResult.error.message);
      setLoading(false);
      return;
    }

    if (servicesResult.error) {
      setCategories([]);
      setServices([]);
      setError(servicesResult.error.message);
      setLoading(false);
      return;
    }

    setCategories(
      (categoriesResult.data ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        position: category.position,
        services: [],
      })),
    );

    setServices((servicesResult.data ?? []).map(toService));
    setLoading(false);
  }, [proId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCategory(name: string) {
    if (!proId) {
      throw new Error("Fiche professionnelle introuvable.");
    }

    const cleanName = name.trim();

    if (!cleanName) {
      throw new Error("Le nom de la catégorie est obligatoire.");
    }

    setSaving(true);
    setError(null);

    const { error: createError } = await supabase
      .from("pro_service_categories")
      .insert({
        pro_id: proId,
        name: cleanName,
        position: categories.length,
        active: true,
      });

    setSaving(false);

    if (createError) {
      setError(createError.message);
      throw createError;
    }

    await load();
  }

  async function createService(draft: ProServiceDraft) {
    if (!proId) {
      throw new Error("Fiche professionnelle introuvable.");
    }

    validateServiceDraft(draft);

    setSaving(true);
    setError(null);

    const { error: createError } = await supabase
      .from("pro_services")
      .insert({
        pro_id: proId,
        category_id: draft.categoryId,
        slug: makeSlug(draft.name),
        name: draft.name.trim(),
        duration_min: Math.round(draft.duration),
        price: draft.price,
        active: true,
        position: services.length,
      });

    setSaving(false);

    if (createError) {
      setError(createError.message);
      throw createError;
    }

    await load();
  }

  async function updateService(id: string, draft: ProServiceDraft) {
    validateServiceDraft(draft);

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("pro_services")
      .update({
        category_id: draft.categoryId,
        name: draft.name.trim(),
        duration_min: Math.round(draft.duration),
        price: draft.price,
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

  async function disableService(id: string) {
    setSaving(true);
    setError(null);

    const { error: disableError } = await supabase
      .from("pro_services")
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
    categories,
    services,
    servicesByCategory,
    loading,
    saving,
    error,
    reload: load,
    createCategory,
    createService,
    updateService,
    disableService,
  };
}