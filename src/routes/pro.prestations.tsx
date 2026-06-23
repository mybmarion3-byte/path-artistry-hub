import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { Scissors, Plus, Edit, Clock, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { useProServices } from "@/hooks/use-pro-services";

export const Route = createFileRoute("/pro/prestations")({
  head: () => ({ meta: [{ title: "Mes prestations — Booker Pro" }] }),
  component: Page,
});

type Form = { name: string; duration: number; price: number };

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

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Form>({ name: "", duration: 30, price: 30 });
  const [creating, setCreating] = useState(false);
  const loading = profileLoading || servicesLoading;
  const error = profileError || servicesError;

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setDraft({ name: "", duration: 30, price: 30 });
  }
  function startEdit(id: string) {
    const s = services.find((x) => x.id === id);
    if (!s) return;
    setCreating(false);
    setEditing(id);
    setDraft({ name: s.name, duration: s.duration, price: s.price });
  }
  async function save() {
    if (!draft.name.trim()) return toast.error("Nom requis");
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
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Impossible d'enregistrer la prestation");
    }
  }
  function cancel() {
    setEditing(null);
    setCreating(false);
  }
  async function remove(id: string, name: string) {
    try {
      await disableService(id);
      toast(`« ${name} » supprimée`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Impossible de supprimer la prestation");
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Scissors className="w-7 h-7 text-emerald-600" /> Mes prestations
            </h1>
            <p className="text-muted-foreground mt-1">{services.length} prestations actives</p>
          </div>
          <button
            onClick={startCreate}
            disabled={!pro || loading || saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {(creating || editing) && (
          <div className="mt-6 bg-card border-2 border-emerald-500/40 rounded-2xl p-5 shadow-soft">
            <div className="text-sm font-semibold mb-3">{creating ? "Nouvelle prestation" : "Modifier la prestation"}</div>
            <div className="grid grid-cols-[1fr_120px_120px_auto] gap-3 items-end">
              <Field label="Nom">
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Ex : Coupe homme"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </Field>
              <Field label="Durée (min)">
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={draft.duration}
                  onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </Field>
              <Field label="Prix (€)">
                <input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </Field>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving} className="h-10 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Enregistrer
                </button>
                <button onClick={cancel} className="h-10 px-3 rounded-lg border border-border text-sm hover:bg-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              Chargement…
            </div>
          )}
          {!loading && !pro && (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
              Fiche professionnelle introuvable.
            </div>
          )}
          {!loading && pro && error && (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
              Impossible de charger les prestations.
            </div>
          )}
          {!loading && pro && !error && services.length === 0 && (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
              Aucune prestation. Cliquez sur « Ajouter » pour commencer.
            </div>
          )}
          {!loading && pro && !error && services.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-soft">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration} min</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xl font-semibold">{s.price} €</div>
                </div>
                <button onClick={() => startEdit(s.id)} disabled={saving} className="w-9 h-9 rounded-lg border border-border hover:bg-secondary flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => remove(s.id, s.name)} disabled={saving} className="w-9 h-9 rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      {children}
    </label>
  );
}
