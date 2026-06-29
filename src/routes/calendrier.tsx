import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { listMyBookings } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/calendrier")({
  head: () => ({ meta: [{ title: "Calendrier — Booker NoW" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const fetchBookings = useServerFn(listMyBookings);
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "me", "calendar"],
    queryFn: () => fetchBookings(),
  });
  const [month] = useState(() => new Date());
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1).getDay();
  const days = new Date(year, m + 1, 0).getDate();
  const monthLabel = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/calendrier" } });
    });
  }, [navigate]);

  const byDate = (bookings as any[]).reduce<Record<string, any[]>>((acc, b) => {
    const date = new Date(b.start_at).toISOString().slice(0, 10);
    (acc[date] ??= []).push(b);
    return acc;
  }, {});

  const upcoming = (bookings as any[])
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

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
                          {(e.pros?.name ?? "Pro").split(" ")[0]}{" "}
                          {new Date(e.start_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
              {isLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
              )}
              {!isLoading && upcoming.slice(0, 5).map((b) => {
                const p = b.pros;
                const start = new Date(b.start_at);
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    {p?.avatar_url ? (
                      <img src={p.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-semibold">
                        {(p?.name ?? "P").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p?.name ?? "Pro"}</div>
                      <div className="text-xs text-muted-foreground">
                        {start.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} •{" "}
                        {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!isLoading && upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun rendez-vous prévu.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
