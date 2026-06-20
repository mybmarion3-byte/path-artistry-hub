import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker } from "@/lib/booker-store";
import { Inbox, Check, X, MapPin, Clock, Zap, Filter } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/demandes")({
  head: () => ({ meta: [{ title: "Demandes entrantes — Booker Pro" }] }),
  component: Page,
});

function Page() {
  const inbox = useBooker((s) => s.proInbox);
  const accept = useBooker((s) => s.acceptProRequest);
  const decline = useBooker((s) => s.declineProRequest);

  const pending = inbox.filter((r) => r.status === "pending");
  const handled = inbox.filter((r) => r.status !== "pending");

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Inbox className="w-7 h-7 text-emerald-600" /> Demandes entrantes
            </h1>
            <p className="text-muted-foreground mt-1">{pending.length} en attente · {handled.length} traitées</p>
          </div>
          <button className="h-10 px-4 rounded-xl border border-border flex items-center gap-2 text-sm hover:bg-secondary">
            <Filter className="w-4 h-4" /> Filtrer
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {pending.length === 0 && (
            <div className="bg-card border border-border rounded-3xl p-12 text-center">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold mt-3">Boîte vide</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Les nouvelles demandes apparaîtront ici en temps réel.
              </p>
              <Link to="/pro" className="inline-block mt-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
                Retour au tableau de bord
              </Link>
            </div>
          )}

          {pending.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:border-emerald-500/40 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-semibold">{r.serviceName}</h3>
                    <span className="text-sm text-muted-foreground">· {r.clientName}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {r.location} · {r.distanceKm} km</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.when}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-semibold">{r.price} €</div>
                  <div className="text-xs text-muted-foreground">budget client</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { accept(r.id); toast.success(`Demande de ${r.clientName} acceptée`); }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Accepter
                </button>
                <button
                  onClick={() => { decline(r.id); toast("Demande déclinée"); }}
                  className="px-5 border border-border rounded-xl text-sm hover:bg-secondary flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Décliner
                </button>
              </div>
            </div>
          ))}

          {handled.length > 0 && (
            <div className="pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Historique</h2>
              {handled.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 border border-border rounded-xl mb-2 opacity-70">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.serviceName} — {r.clientName}</div>
                    <div className="text-xs text-muted-foreground">{r.when}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"
                  }`}>
                    {r.status === "accepted" ? "Acceptée" : "Déclinée"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
