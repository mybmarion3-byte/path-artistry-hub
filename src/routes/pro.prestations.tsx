import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker, getPro } from "@/lib/booker-store";
import { Scissors, Plus, Edit, Clock } from "lucide-react";

export const Route = createFileRoute("/pro/prestations")({
  head: () => ({ meta: [{ title: "Mes prestations — Booker Pro" }] }),
  component: Page,
});

function Page() {
  const proIdentityId = useBooker((s) => s.proIdentityId);
  const pro = getPro(proIdentityId);

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Scissors className="w-7 h-7 text-emerald-600" /> Mes prestations
            </h1>
            <p className="text-muted-foreground mt-1">{pro.services.length} prestations actives</p>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {pro.services.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-soft">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration} min</span>
                  <span>· Catégorie : {pro.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xl font-semibold">{s.price} €</div>
                </div>
                <button className="w-9 h-9 rounded-lg border border-border hover:bg-secondary flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
