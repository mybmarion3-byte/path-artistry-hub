import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  Plus,
  Scissors,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app/AppLayout";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { useProServices } from "@/hooks/use-pro-services";

export const Route = createFileRoute("/pro/prestations")({
  head: () => ({ meta: [{ title: "Catalogue de prestations — Booker Pro" }] }),
  component: Page,
});

type Form = {
  name: string;
  duration: number;
  price: number;
};

type CatalogItem = {
  id: string;
  profession: string;
  group: string;
  category: string;
  name: string;
  subtitle: string;
  duration: number;
  description: string;
};

const catalogItems: CatalogItem[] = [
  {
    id: "hair-color-roots",
    profession: "Coiffure",
    group: "Femme",
    category: "Coloration",
    name: "Couleur racines",
    subtitle: "Application de couleur sur les racines",
    duration: 90,
    description: "Coloration des repousses jusqu’à 2 cm.",
  },
  {
    id: "hair-full-color",
    profession: "Coiffure",
    group: "Femme",
    category: "Coloration",
    name: "Coloration complète",
    subtitle: "Application de couleur sur l’ensemble de la chevelure",
    duration: 120,
    description: "Coloration complète de la racine aux pointes.",
  },
  {
    id: "hair-balayage",
    profession: "Coiffure",
    group: "Femme",
    category: "Coloration",
    name: "Balayage",
    subtitle: "Mèches éclaircissantes à l’air libre",
    duration: 150,
    description: "Éclaircissement partiel pour un effet naturel et lumineux.",
  },
  {
    id: "hair-ombre",
    profession: "Coiffure",
    group: "Femme",
    category: "Coloration",
    name: "Ombré hair",
    subtitle: "Dégradé de couleur sur les longueurs",
    duration: 150,
    description: "Effet dégradé plus marqué entre racines et pointes.",
  },
  {
    id: "hair-patine",
    profession: "Coiffure",
    group: "Femme",
    category: "Coloration",
    name: "Patine",
    subtitle: "Neutralisation des reflets",
    duration: 45,
    description: "Ravive ou neutralise les reflets jaunes ou cuivrés.",
  },
  {
    id: "hair-gloss",
    profession: "Coiffure",
    group: "Femme",
    category: "Coloration",
    name: "Gloss / Soin repigmentant",
    subtitle: "Soin sublimateur de couleur",
    duration: 30,
    description: "Apporte brillance et intensité à la couleur.",
  },
  {
    id: "hair-cut-woman",
    profession: "Coiffure",
    group: "Femme",
    category: "Coupe",
    name: "Coupe femme",
    subtitle: "Coupe personnalisée",
    duration: 45,
    description: "Diagnostic, coupe et finition.",
  },
  {
    id: "hair-brushing",
    profession: "Coiffure",
    group: "Femme",
    category: "Brushing",
    name: "Brushing",
    subtitle: "Coiffage sur cheveux courts à longs",
    duration: 35,
    description: "Mise en forme durable et finition professionnelle.",
  },
  {
    id: "hair-wedding-bride",
    profession: "Coiffure",
    group: "Mariage",
    category: "Mariage",
    name: "Coiffure mariée",
    subtitle: "Coiffure jour J",
    duration: 150,
    description: "Préparation et réalisation de la coiffure de mariée.",
  },
];

const categories = [
  {
    profession: "Coiffure",
    groups: [
      {
        name: "Femme",
        categories: ["Coupe", "Brushing", "Coloration", "Balayage", "Patine", "Soins", "Extensions"],
      },
      {
        name: "Homme",
        categories: ["Coupe", "Barbe"],
      },
      {
        name: "Enfant",
        categories: ["Garçon", "Fille"],
      },
      {
        name: "Mariage",
        categories: ["Mariée", "Invitée", "Essai"],
      },
    ],
  },
  {
    profession: "Esthétique",
    groups: [
      {
        name: "Beauté",
        categories: ["Ongles", "Regard", "Maquillage", "Épilation"],
      },
    ],
  },
  {
    profession: "Massage",
    groups: [
      {
        name: "Bien-être",
        categories: ["Relaxant", "Sportif", "Drainage"],
      },
    ],
  },
];

function Page() {
  const { pro, loading: profileLoading, error: profileError } = useCurrentUserProfile();

  const {
    services,
    loading: servicesLoading,
    saving,
    error: servicesError,
    createService,
    updateService,
    disableService,
  } = useProServices(pro?.id);

  const [activeTab, setActiveTab] = useState<"catalog" | "active" | "disabled">("catalog");
  const [selectedCategory, setSelectedCategory] = useState("Coloration");
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Form>({ name: "", duration: 30, price: 30 });
  const [creating, setCreating] = useState(false);

  const loading = profileLoading || servicesLoading;
  const error = profileError || servicesError;

  const filteredCatalog = useMemo(() => {
    return catalogItems.filter((item) => {
      const matchesCategory = item.category === selectedCategory;
      const matchesQuery =
        !query.trim() ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setDraft({ name: "", duration: 30, price: 30 });
  }

  function startCreateFromCatalog(item: CatalogItem) {
    setEditing(null);
    setCreating(true);
    setDraft({
      name: item.name,
      duration: item.duration,
      price: 30,
    });
  }

  function startEdit(id: string) {
    const s = services.find((x) => x.id === id);
    if (!s) return;

    setCreating(false);
    setEditing(id);
    setDraft({ name: s.name, duration: s.duration, price: s.price });
  }

  async function save() {
    if (!draft.name.trim()) {
      toast.error("Nom requis");
      return;
    }

    try {
      if (creating) {
        await createService(draft);
        toast.success(`Prestation « ${draft.name} » ajoutée`);
      } else if (editing) {
        await updateService(editing, draft);
        toast.success("Prestation modifiée");
      }

      setEditing(null);
      setCreating(false);
      setActiveTab("active");
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer la prestation",
      );
    }
  }

  function cancel() {
    setEditing(null);
    setCreating(false);
  }

  async function remove(id: string, name: string) {
    try {
      await disableService(id);
      toast(`« ${name} » désactivée`);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Impossible de supprimer la prestation",
      );
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Catalogue de prestations
              </h1>
              <p className="mt-2 text-muted-foreground">
                Créez et gérez vos prestations à partir du catalogue Booker.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary">
                <HelpCircle className="h-4 w-4" />
                Comment ça fonctionne ?
              </button>

              <button
                onClick={startCreate}
                disabled={!pro || loading || saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-soft hover:bg-emerald-800 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Ajouter une prestation personnalisée
              </button>
            </div>
          </header>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Le catalogue Booker</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                    Nous fournissons une base de prestations standardisées par métier.
                    Vous sélectionnez celles que vous proposez, puis vous personnalisez
                    prix, durée, lieux et options.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center text-xs font-medium text-muted-foreground">
                {["Catalogue Booker", "Vous sélectionnez", "Vous personnalisez", "Disponible à la réservation"].map(
                  (step, index) => (
                    <div key={step} className="relative rounded-2xl bg-white/70 p-4">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        {index === 3 ? <Check className="h-5 w-5" /> : index + 1}
                      </div>
                      {step}
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>

          <nav className="border-b border-border">
            <div className="flex gap-8">
              <Tab
                active={activeTab === "catalog"}
                onClick={() => setActiveTab("catalog")}
              >
                Catalogue Booker
              </Tab>
              <Tab
                active={activeTab === "active"}
                onClick={() => setActiveTab("active")}
              >
                Mes prestations actives ({services.length})
              </Tab>
              <Tab
                active={activeTab === "disabled"}
                onClick={() => setActiveTab("disabled")}
              >
                Prestations désactivées
              </Tab>
            </div>
          </nav>

          {(creating || editing) && (
            <section className="rounded-2xl border-2 border-emerald-500/40 bg-card p-5 shadow-soft">
              <div className="mb-4 text-sm font-semibold">
                {creating ? "Nouvelle prestation" : "Modifier la prestation"}
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_140px_140px_auto] lg:items-end">
                <Field label="Nom">
                  <input
                    autoFocus
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Ex : Brushing"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  />
                </Field>

                <Field label="Durée (min)">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={draft.duration}
                    onChange={(e) =>
                      setDraft({ ...draft, duration: Number(e.target.value) })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  />
                </Field>

                <Field label="Prix (€)">
                  <input
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={(e) =>
                      setDraft({ ...draft, price: Number(e.target.value) })
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  />
                </Field>

                <div className="flex gap-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex h-10 items-center gap-1 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Enregistrer
                  </button>

                  <button
                    onClick={cancel}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "catalog" && (
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <aside className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher une catégorie..."
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
                  />
                </div>

                <div className="space-y-4">
                  {categories.map((profession) => (
                    <div key={profession.profession}>
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <ChevronDown className="h-4 w-4" />
                        <Scissors className="h-4 w-4" />
                        {profession.profession}
                      </div>

                      <div className="space-y-2 pl-6">
                        {profession.groups.map((group) => (
                          <div key={group.name}>
                            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                              <ChevronDown className="h-4 w-4" />
                              {group.name}
                            </div>

                            <div className="space-y-1 border-l border-border pl-5">
                              {group.categories.map((category) => (
                                <button
                                  key={category}
                                  onClick={() => setSelectedCategory(category)}
                                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                                    selectedCategory === category
                                      ? "bg-emerald-50 font-semibold text-emerald-800"
                                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                  }`}
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <div className="flex items-center justify-between border-b border-border p-5">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedCategory}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {filteredCatalog.length} prestations dans cette catégorie
                    </p>
                  </div>

                  <button className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-secondary">
                    Trier par
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-[1.4fr_180px_1fr_140px] border-b border-border bg-secondary/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <div>Prestation</div>
                  <div>Durée conseillée</div>
                  <div>Description</div>
                  <div className="text-right">Sélectionner</div>
                </div>

                {filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.4fr_180px_1fr_140px] items-center border-b border-border px-5 py-4 last:border-0"
                  >
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.subtitle}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {item.duration} min
                    </div>

                    <div className="text-sm leading-5 text-muted-foreground">
                      {item.description}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => startCreateFromCatalog(item)}
                        disabled={!pro || loading || saving}
                        className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {activeTab === "active" && (
            <section className="space-y-3">
              {loading && <EmptyState>Chargement…</EmptyState>}

              {!loading && !pro && (
                <EmptyState>Fiche professionnelle introuvable.</EmptyState>
              )}

              {!loading && pro && error && (
                <EmptyState>Impossible de charger les prestations.</EmptyState>
              )}

              {!loading && pro && !error && services.length === 0 && (
                <EmptyState>
                  Aucune prestation active. Ajoutez une prestation depuis le catalogue Booker.
                </EmptyState>
              )}

              {!loading &&
                pro &&
                !error &&
                services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-soft"
                  >
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {s.duration} min
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-semibold">{s.price} €</div>
                      </div>

                      <button
                        onClick={() => startEdit(s.id)}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-secondary"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => remove(s.id, s.name)}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </section>
          )}

          {activeTab === "disabled" && (
            <EmptyState>
              Les prestations désactivées seront affichées ici dans une prochaine étape.
            </EmptyState>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${
        active
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
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
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
      {children}
    </div>
  );
}