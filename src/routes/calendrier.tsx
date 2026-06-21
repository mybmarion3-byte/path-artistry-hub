import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker, getPro } from "@/lib/booker-store";
import { useState } from "react";

export const Route = createFileRoute("/calendrier")({
  head: () => ({ meta: [{ title: "Calendrier — Booker \Booker NoWnbsp;NoW" }] }),
  component: Page,
});

function Page() {
  const bookings = useBooker((s) => s.bookings);
  const [month] = useState(() => new Date());
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1).getDay();
  const days = new Date(year, m + 1, 0).getDate();
  const monthLabel = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const today = new Date().toISOString().slice(0, 10);

  const byDate = bookings.reduce<Record<string, typeof bookings>>((acc, b) => {
    (acc[b.date] ??= []).push(b);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <h1 className="text-3xl font-semibold">Calendrier</h1>
        <p className="text-muted-foreground mt-1 capitalize">{monthLabel}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-8">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2 mt-3">
              {Array.from({ length: (first + 6) % 7 }).map((_, i) => <div key={`p${i}`} />)}
              {Array.from({ length: days }).map((_, i) => {
                const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                const events = byDate[date] ?? [];
                const isToday = date === today;
                return (
                  <div key={i} className={`aspect-square rounded-xl border p-1.5 flex flex-col text-xs ${
                    isToday ? "border-primary bg-accent/40" : "border-border"
                  }`}>
                    <div className={`font-medium ${isToday ? "text-primary" : ""}`}>{i + 1}</div>
                    <div className="flex-1 mt-1 space-y-0.5 overflow-hidden">
                      {events.slice(0, 2).map((e) => (
                        <div key={e.id} className="text-[10px] truncate bg-gradient-primary text-primary-foreground px-1 py-0.5 rounded">
                          {getPro(e.proId).name.split(" ")[0]} {e.time}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft h-fit">
            <h3 className="font-semibold">Prochains rendez-vous</h3>
            <div className="mt-4 space-y-3">
              {bookings.filter((b) => b.status === "upcoming").slice(0, 5).map((b) => {
                const p = getPro(b.proId);
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    <img src={p.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{b.date} • {b.time}</div>
                    </div>
                  </div>
                );
              })}
              {bookings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun rendez-vous prévu.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
