import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker } from "@/lib/booker-store";
import { Users, Star, MessageSquare, Search, Plus, X, Crown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/clients")({
  head: () => ({ meta: [{ title: "Mes clients — Booker Pro" }] }),
  component: Page,
});

function Page() {
  const clients = useBooker((s) => s.proClients);
  const addClient = useBooker((s) => s.addProClient);
  const updateNote = useBooker((s) => s.updateProClientNote);
  const toggleVip = useBooker((s) => s.toggleProClientVip);
  const sendMessage = useBooker((s) => s.sendMessage);
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [draft, setDraft] = useState({ name: "", lastService: "Brushing" });

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [clients, q],
  );

  function openEditNote(id: string) {
    setOpenNote(id);
    setNoteDraft(clients.find((c) => c.id === id)?.note ?? "");
  }
  function saveNote() {
    if (!openNote) return;
    updateNote(openNote, noteDraft);
    toast.success("Note enregistrée");
    setOpenNote(null);
  }
  function message(name: string) {
    sendMessage("camille", `Bonjour ${name.split(" ")[0]} 👋`);
    toast.success(`Message envoyé à ${name.split(" ")[0]}`);
    navigate({ to: "/messages" });
  }
  function createClient() {
    if (!draft.name.trim()) return toast.error("Nom requis");
    addClient({ ...draft, visits: 0, spent: 0, rating: 5 });
    toast.success("Client ajouté");
    setOpenNew(false);
    setDraft({ name: "", lastService: "Brushing" });
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Users className="w-7 h-7 text-emerald-600" /> Mes clients
            </h1>
            <p className="text-muted-foreground mt-1">{clients.length} clients · {clients.filter((c) => c.vip).length} VIP</p>
          </div>
          <button
            onClick={() => setOpenNew(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau client
          </button>
        </div>

        <div className="mt-5 relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-card text-sm"
          />
        </div>

        <div className="mt-6 bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Visites</th>
                <th className="text-left px-5 py-3">Dernier service</th>
                <th className="text-left px-5 py-3">Total dépensé</th>
                <th className="text-left px-5 py-3">Note</th>
                <th className="text-left px-5 py-3">Mémo</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Aucun client trouvé.</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-5 py-3 font-medium">
                    <button onClick={() => toggleVip(c.id)} className="inline-flex items-center gap-2" title={c.vip ? "Retirer VIP" : "Marquer VIP"}>
                      {c.vip && <Crown className="w-4 h-4 text-warning fill-warning" />}
                      {c.name}
                    </button>
                  </td>
                  <td className="px-5 py-3">{c.visits}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.lastService}</td>
                  <td className="px-5 py-3 font-semibold">{c.spent} €</td>
                  <td className="px-5 py-3"><span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-warning text-warning" />{c.rating}</span></td>
                  <td className="px-5 py-3">
                    <button onClick={() => openEditNote(c.id)} className="text-xs text-emerald-600 hover:underline truncate max-w-[180px] block text-left">
                      {c.note ? c.note.slice(0, 30) + (c.note.length > 30 ? "…" : "") : "+ ajouter"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => message(c.name)} className="text-emerald-600 hover:text-emerald-700" title="Envoyer un message">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openNote && (
        <Modal title="Mémo client" onClose={() => setOpenNote(null)}>
          <textarea
            autoFocus
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={5}
            placeholder="Allergies, préférences, anecdotes…"
            className="w-full p-3 rounded-lg border border-border bg-background text-sm"
          />
          <button onClick={saveNote} className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold">
            Enregistrer
          </button>
        </Modal>
      )}

      {openNew && (
        <Modal title="Nouveau client" onClose={() => setOpenNew(false)}>
          <div className="space-y-3">
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Nom complet"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
            <input
              value={draft.lastService}
              onChange={(e) => setDraft({ ...draft, lastService: e.target.value })}
              placeholder="Dernier service"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <button onClick={createClient} className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold">
            Ajouter
          </button>
        </Modal>
      )}
    </AppLayout>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
