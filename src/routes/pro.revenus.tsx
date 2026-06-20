import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { Wallet, TrendingUp, Download } from "lucide-react";

export const Route = createFileRoute("/pro/revenus")({
  head: () => ({ meta: [{ title: "Revenus — Booker Pro" }] }),
  component: Page,
});

const MONTHS = [
  { m: "Jan", v: 2400 }, { m: "Fév", v: 2800 }, { m: "Mar", v: 3100 },
  { m: "Avr", v: 2950 }, { m: "Mai", v: 3450 }, { m: "Juin", v: 3820 },
];

function Page() {
  const total = MONTHS.reduce((s, m) => s + m.v, 0);
  const max = Math.max(...MONTHS.map((m) => m.v));

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Wallet className="w-7 h-7 text-emerald-600" /> Revenus
            </h1>
            <p className="text-muted-foreground mt-1">6 derniers mois</p>
          </div>
          <button className="border border-border hover:bg-secondary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5">
            <div className="text-xs font-semibold opacity-80 uppercase">Total 6 mois</div>
            <div className="text-3xl font-semibold mt-2">{total.toLocaleString("fr-FR")} €</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Ce mois</div>
            <div className="text-3xl font-semibold mt-2">3 820 €</div>
            <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +11% vs mai</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Prochain virement</div>
            <div className="text-3xl font-semibold mt-2">1 240 €</div>
            <div className="text-xs text-muted-foreground mt-1">le 25 juin</div>
          </div>
        </div>

        <div className="mt-6 bg-card border border-border rounded-3xl p-6 shadow-soft">
          <h2 className="text-sm font-semibold mb-5">Évolution mensuelle</h2>
          <div className="flex items-end gap-4 h-56">
            {MONTHS.map((m) => (
              <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-semibold tabular-nums">{m.v} €</div>
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg"
                  style={{ height: `${(m.v / max) * 100}%` }}
                />
                <div className="text-xs text-muted-foreground">{m.m}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
