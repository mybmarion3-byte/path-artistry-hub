import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { Users, Star, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/pro/clients")({
  head: () => ({ meta: [{ title: "Mes clients — Booker Pro" }] }),
  component: Page,
});

const CLIENTS = [
  { name: "Marion Durand", visits: 12, lastService: "Couleur", spent: 720, rating: 5 },
  { name: "Sophie Laurent", visits: 8, lastService: "Brushing", spent: 360, rating: 5 },
  { name: "Anna Roux", visits: 5, lastService: "Coupe + brushing", spent: 275, rating: 4 },
  { name: "Léa Martin", visits: 3, lastService: "Balayage", spent: 360, rating: 5 },
  { name: "Inès Bernard", visits: 2, lastService: "Coupe", spent: 90, rating: 4 },
];

function Page() {
  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Users className="w-7 h-7 text-emerald-600" /> Mes clients
        </h1>
        <p className="text-muted-foreground mt-1">{CLIENTS.length} clients fidèles</p>

        <div className="mt-6 bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Visites</th>
                <th className="text-left px-5 py-3">Dernier service</th>
                <th className="text-left px-5 py-3">Total dépensé</th>
                <th className="text-left px-5 py-3">Note</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.name} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3">{c.visits}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.lastService}</td>
                  <td className="px-5 py-3 font-semibold">{c.spent} €</td>
                  <td className="px-5 py-3"><span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-warning text-warning" />{c.rating}</span></td>
                  <td className="px-5 py-3"><button className="text-emerald-600 hover:text-emerald-700"><MessageSquare className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
