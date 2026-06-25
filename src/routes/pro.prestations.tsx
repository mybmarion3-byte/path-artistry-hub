import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { useProServices } from "@/hooks/use-pro-services";
import {
  Check,
  Clock,
  Edit,
  FolderPlus,
  Plus,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/prestations")({
  head: () => ({ meta: [{ title: "Mes prestations — Booker Pro" }] }),
  component: Page,
});

type ServiceForm = {
  name: string;
  duration: number;
  price: number;
  categoryId: string | null;
};

function Page() {
  const { pro, loading: profileLoading, error: profileError } =
    useCurrentUserProfile();

  const {
    categories,
    servicesByCategory,
    services,
    loading: servicesLoading,
    saving,
    error: servicesError,
    createCategory,
    createService,
    updateService,
    disableService,
  } = useProServices(pro?.id);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [creatingService, setCreatingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [draft, setDraft] = useState<ServiceForm>({
    name: "",
    duration: 30,
    price: 30,
    categoryId: null,
  });

  const loading = profileLoading || servicesLoading;
  const error = profileError || servicesError;

  const activeServicesCount = services.length;

  const firstCategoryId = useMemo(() => {
    return categories[0]?.id ?? null;
  }, [categories]);

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      toast.error("Ajoutez un nom de catégorie.");
      return;
    }

    try {
      await createCategory(newCategoryName);
      toast.success("Catégorie ajoutée.");
      setNewCategoryName("");
      setCreatingCategory(false);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible de créer la catégorie.",
      );
    }
  }

  function startCreateService(categoryId?: string | null) {
    setEditingServiceId(null);
    setCreatingService(true);
    setDraft({
      name: "",
      duration: 30,
      price: 30,
      categoryId: categoryId ?? firstCategoryId,
    });
  }

  function startEditService(id: string) {
    const service = services.find((item) => item.id === id);

    if (!service) return;

    setCreatingService(false);
    setEditingServiceId(id);
    setDraft({
      name: service.name,
      duration: service.duration,
      price: service.price,
      categoryId: service.categoryId,
    });
  }

  function cancelServiceForm() {
    setCreatingService(false);
    setEditingServiceId(null);
    setDraft({
      name: "",
      duration: 30,
      price: 30,
      categoryId: firstCategoryId,
    });
  }

  async function saveService() {
    if (!draft.name.trim()) {
      toast.error("Le nom de la prestation est obligatoire.");
      return;
    }

    if (!draft.categoryId) {
      toast.error("Sélectionnez une catégorie.");
      return;
    }

    try {
      if (creatingService) {
        await createService(draft);
        toast.success(`Prestation « ${draft.name} » ajoutée.`);
      } else if (editingServiceId) {
        await updateService(editingServiceId, draft);
        toast.success("Prestation modifiée.");
      }

      cancelServiceForm();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer la prestation.",
      );
    }
  }

  async function removeService(id: string, name: string) {
    try {
      await disableService(id);
      toast(`« ${name} » supprimée.`);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible de supprimer la prestation.",
      );
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Espace pro
            </div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Scissors className="w-7 h-7 text-emerald-600" />
              Mes prestations
            </h1>
            <p className="text-muted-foreground mt-1">
              Organisez vos prestations par catégorie pour rendre votre fiche
              plus claire côté client.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCreatingCategory(true)}
              disabled={!pro || loading || saving}
              className="border border-border hover:bg-secondary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Catégorie
            </button>

            <button
              onClick={() => startCreateService()}
              disabled={!pro || loading || saving || categories.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Prestation
            </button>
          </div>
        </div>

        {loading && (
          <EmptyState text="Chargement des prestations…" />
        )}

        {!loading && !pro && (
          <EmptyState text="Fiche professionnelle introuvable." />
        )}

        {!loading && pro && error && (
          <EmptyState text={`Impossible de charger les prestations : ${error}`} />
        )}

        {!loading && pro && !error && (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <StatCard label="Catégories" value={categories.length} />
              <StatCard label="Prestations actives" value={activeServicesCount} />
              <StatCard
                label="Statut"
                value={activeServicesCount > 0 ? "Prêt" : "À compléter"}
              />
            </div>

            {creatingCategory && (
              <section className="bg-card border-2 border-emerald-500/40 rounded-2xl p-5 shadow-soft">
                <div className="text-sm font-semibold mb-3">
                  Nouvelle catégorie
                </div>

                <div className="flex gap-3">
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex : Coupes, Colorations, Soins..."
                    className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />

                  <button
                    onClick={handleCreateCategory}
                    disabled={saving}
                    className="h-10 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Créer
                  </button>

                  <button
                    onClick={() => {
                      setCreatingCategory(false);
                      setNewCategoryName("");
                    }}
                    className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {(creatingService || editingServiceId) && (
              <section className="bg-card border-2 border-emerald-500/40 rounded-2xl p-5 shadow-soft">
                <div className="text-sm font-semibold mb-3">
                  {creatingService
                    ? "Nouvelle prestation"
                    : "Modifier la prestation"}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px_120px_auto] gap-3 items-end">
                  <Field label="Nom">
                    <input
                      autoFocus
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      placeholder="Ex : Coupe femme"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </Field>

                  <Field label="Catégorie">
                    <select
                      value={draft.categoryId ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          categoryId: e.target.value || null,
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    >
                      <option value="">Choisir</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Durée">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={draft.duration}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          duration: Number(e.target.value),
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </Field>

                  <Field label="Prix">
                    <input
                      type="number"
                      min={0}
                      value={draft.price}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </Field>

                  <div className="flex gap-2">
                    <button
                      onClick={saveService}
                      disabled={saving}
                      className="h-10 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      OK
                    </button>

                    <button
                      onClick={cancelServiceForm}
                      className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-secondary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {categories.length === 0 && (
              <EmptyState text="Commencez par créer une catégorie, par exemple « Coupes », « Colorations » ou « Soins »." />
            )}

            {servicesByCategory.map((category) => (
              <section
                key={category.id}
                className="bg-card border border-border rounded-3xl p-5 shadow-soft"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{category.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {category.services.length} prestation
                      {category.services.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => startCreateService(category.id)}
                    disabled={saving}
                    className="border border-border hover:bg-secondary rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter ici
                  </button>
                </div>

                {category.services.length === 0 && (
                  <div className="border border-dashed border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
                    Aucune prestation dans cette catégorie.
                  </div>
                )}

                <div className="space-y-3">
                  {category.services.map((service) => (
                    <div
                      key={service.id}
                      className="border border-border rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold">{service.name}</div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-semibold">
                            {service.price} €
                          </div>
                        </div>

                        <button
                          onClick={() => startEditService(service.id)}
                          disabled={saving}
                          className="w-9 h-9 rounded-lg border border-border hover:bg-secondary flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            removeService(service.id, service.name)
                          }
                          disabled={saving}
                          className="w-9 h-9 rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
      {text}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}