import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker } from "@/lib/booker-store";
import { Calendar, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/agenda")({
  head: () => ({ meta: [{ title: "Mon agenda — Booker Pro" }] }),
  component: Page,
});

const WEEK = ["Lun 16", "Mar 17", "Mer 18", "Jeu 19", "Ven 20", "Sam 21", "Dim 22"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

function Page() {
  const slots = useBooker((s) => s.proAgenda);
  const services = useBooker((s) => s.proServices);
  const add = useBooker((s) => s.addAgendaSlot);
  const remove = useBooker((s) => s.removeAgendaSlot);

  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ day: number; hour: number } | null>(null);
  const [clientName, setClientName] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");

  function openAt(day: number, hour: number) {
    setPicked({ day, hour });
    setClientName("");
    setServiceId(services[0]?.id ?? "");
    setOpen(true);
  }
  function save() {
    if (!picked) return;
    if (!clientName.trim()) return toast.error("Nom du client requis");
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return toast.error("Choisissez une prestation");
    add({
      day: picked.day,
      hour: picked.hour,
      dur: Math.max(0.5, svc.duration / 60),
      label: `${svc.name} · ${clientName.split(" ")[0]}`,
      clientName,
      serviceName: svc.name,
      price: svc.price,
    });
    toast.success("Rendez-vous ajouté");
    setOpen(false);
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Calendar className="w-7 h-7 text-emerald-600" /> Mon agenda
            </h1>
            <p className="text-muted-foreground mt-1">Semaine du 16 au 22 juin · {slots.length} RDV · cliquez une case pour ajouter</p>
          </div>
          <button
            onClick={() => openAt(0, 9)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau RDV
          </button>
        </div>

        <div className="mt-6 bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-secondary/50">
            <div />
            {WEEK.map((d) => (
              <div key={d} className="px-2 py-3 text-xs font-semibold text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            <div className="border-r border-border">
              {HOURS.map((h) => (
                <div key={h} className="h-14 px-2 py-1 text-[10px] text-muted-foreground border-b border-border">{h}</div>
              ))}
            </div>
            {WEEK.map((_, dayIdx) => (
              <div key={dayIdx} className="border-r border-border last:border-r-0 relative">
                {HOURS.map((h, hIdx) => (
                  <button
                    key={h}
                    onClick={() => openAt(dayIdx, 8 + hIdx)}
                    className="h-14 w-full border-b border-border hover:bg-emerald-500/5 transition"
                  />
                ))}
                {slots.filter((s) => s.day === dayIdx).map((s) => (
                  <div
                    key={s.id}
                    className="absolute left-1 right-1 bg-emerald-500 text-white rounded-lg p-1.5 text-[10px] font-medium shadow-soft group"
                    style={{ top: (s.hour - 8) * 56 + 2, height: s.dur * 56 - 4 }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="truncate">{s.label}</div>
                      <button
                        onClick={() => { remove(s.id); toast("RDV supprimé"); }}
                        className="opacity-0 group-hover:opacity-100 transition shrink-0"
                        aria-label="Supprimer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[9px] opacity-80">{s.price} €</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Nouveau rendez-vous</h2>
                <div className="text-xs text-muted-foreground">{picked && `${WEEK[picked.day]} à ${picked.hour}h00`}</div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Client</div>
                <input
                  autoFocus
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nom du client"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </label>
              <label className="block">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prestation</div>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.duration} min — {s.price} €</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Heure</div>
                <select
                  value={picked?.hour ?? 9}
                  onChange={(e) => setPicked((p) => p ? { ...p, hour: Number(e.target.value) } : p)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  {HOURS.map((h, i) => <option key={h} value={8 + i}>{h}</option>)}
                </select>
              </label>
            </div>
            <button
              onClick={save}
              className="mt-5 w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Ajouter au planning
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
