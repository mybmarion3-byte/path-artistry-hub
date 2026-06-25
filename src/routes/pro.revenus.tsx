import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker } from "@/lib/booker-store";
import { Wallet, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/revenus")({
  head: () => ({ meta: [{ title: "Revenus — Booker Pro" }] }),
  component: Page,
});

const ALL_MONTHS = [
  { m: "Juil", v: 2100 }, { m: "Août", v: 1800 }, { m: "Sept", v: 2650 },
  { m: "Oct", v: 2900 }, { m: "Nov", v: 3050 }, { m: "Déc", v: 3300 },
  { m: "Jan", v: 2400 }, { m: "Fév", v: 2800 }, { m: "Mar", v: 3100 },
  { m: "Avr", v: 2950 }, { m: "Mai", v: 3450 }, { m: "Juin", v: 3820 },
];

function Page() {
  const period = useBooker((s) => s.revenuePeriod);
  const setPeriod = useBooker((s) => s.setRevenuePeriod);
  const n = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const months = ALL_MONTHS.slice(-n);
  const total = months.reduce((s, m) => s + m.v, 0);
  const max = Math.max(...months.map((m) => m.v));
  const last = months[months.length - 1].v;
  const prev = months[months.length - 2]?.v ?? last;
  const delta = Math.round(((last - prev) / prev) * 100);

  function exportCSV() {
    const csv = "Mois,Revenu (EUR)\n" + months.map((m) => `${m.m},${m.v}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenus-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Wallet className="w-7 h-7 text-emerald-600" /> Revenus
            </h1>
            <p className="text-muted-foreground mt-1">{n} derniers mois</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xl bg-secondary flex gap-1">
              {(["3m", "6m", "12m"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    period === p ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "3m" ? "3 mois" : p === "6m" ? "6 mois" : "12 mois"}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="border border-border hover:bg-secondary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
              <Download className="w-4 h-4" /> Exporter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5">
            <div className="text-xs font-semibold opacity-80 uppercase">Total {n} mois</div>
            <div className="text-3xl font-semibold mt-2">{total.toLocaleString("fr-FR")} €</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Ce mois</div>
            <div className="text-3xl font-semibold mt-2">{last.toLocaleString("fr-FR")} €</div>
            <div className={`text-xs mt-1 flex items-center gap-1 ${delta >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              <TrendingUp className="w-3 h-3" /> {delta >= 0 ? "+" : ""}{delta}% vs mois précédent
            </div>
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
            {months.map((m) => (
              <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-semibold tabular-nums">{m.v} €</div>
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all"
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
