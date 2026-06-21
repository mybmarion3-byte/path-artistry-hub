import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker } from "@/lib/booker-store";
import { TrendingUp, Users, Calendar, Euro } from "lucide-react";

export const Route = createFileRoute("/analyses")({
  head: () => ({ meta: [{ title: "Analyses — Booker NoW" }] }),
  component: Page,
});

function Page() {
  const bookings = useBooker((s) => s.bookings);
  const revenue = bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.price, 0);
  const points = [12, 18, 14, 22, 28, 35, 30, 42, 38, 50, 46, 60];

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">Analyses</h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gradient-primary text-primary-foreground">NOUVEAU</span>
        </div>
        <p className="text-muted-foreground mt-1">Comprenez vos habitudes et vos économies.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <KPI icon={Calendar} label="Réservations" value={String(bookings.length)} trend="+24%" />
          <KPI icon={Euro} label="Dépensé" value={`${revenue} €`} trend="+12%" />
          <KPI icon={Users} label="Pros utilisés" value="6" trend="+2" />
          <KPI icon={TrendingUp} label="Note moyenne" value="4.9" trend="" />
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 mt-6 shadow-soft">
          <h2 className="font-semibold">Évolution des réservations</h2>
          <p className="text-xs text-muted-foreground mt-1">12 derniers mois</p>
          <svg viewBox="0 0 600 200" className="w-full mt-4 h-48">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.58 0.22 285)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="oklch(0.58 0.22 285)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="oklch(0.58 0.22 285)"
              strokeWidth="3"
              points={points.map((v, i) => `${(i * 600) / 11},${200 - (v / 70) * 180}`).join(" ")}
            />
            <polygon
              fill="url(#g)"
              points={`0,200 ${points.map((v, i) => `${(i * 600) / 11},${200 - (v / 70) * 180}`).join(" ")} 600,200`}
            />
          </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <h3 className="font-semibold">Catégories préférées</h3>
            <div className="mt-4 space-y-3">
              {[{ k: "Coiffure", p: 45 }, { k: "Bien-être", p: 30 }, { k: "Sport", p: 15 }, { k: "Beauté", p: 10 }].map((c) => (
                <div key={c.k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.k}</span><span className="text-muted-foreground">{c.p}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${c.p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <h3 className="font-semibold">Insights</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2"><span className="text-primary">●</span> Vous réservez en moyenne 3 jours à l'avance.</li>
              <li className="flex gap-2"><span className="text-primary">●</span> Vos créneaux préférés sont entre 15h et 18h.</li>
              <li className="flex gap-2"><span className="text-primary">●</span> Vous économisez 22% grâce au programme fidélité.</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function KPI({ icon: Icon, label, value, trend }: { icon: typeof TrendingUp; label: string; value: string; trend: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 text-primary" />
        {trend && <span className="text-xs font-medium text-success">{trend}</span>}
      </div>
      <div className="text-2xl font-semibold mt-3">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
