import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { listProBookings } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Inbox, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";

export const Route = createFileRoute("/pro/agenda")({
  head: () => ({ meta: [{ title: "Mon agenda — Booker Pro" }] }),
  component: Page,
});

const HOURS = Array.from({ length: 12 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

type BookingRow = {
  id: string;
  service_name: string;
  start_at: string;
  end_at: string | null;
  price: number | string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  profiles?: {
    full_name: string | null;
  } | null;
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + 1);
  return d;
}

function buildWeek(date = new Date()) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      date: day,
      label: day.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" }),
    };
  });
}

function Page() {
  const navigate = useNavigate();
  const fetchBookings = useServerFn(listProBookings);
  const week = useMemo(() => buildWeek(), []);
  const weekStart = week[0].date;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/pro/agenda" } });
    });
  }, [navigate]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "pro", "agenda"],
    queryFn: () => fetchBookings(),
  });

  const slots = useMemo(() => {
    return (bookings as BookingRow[])
      .filter((booking) => booking.status === "confirmed" || booking.status === "completed")
      .map((booking) => {
        const start = new Date(booking.start_at);
        const end = booking.end_at ? new Date(booking.end_at) : new Date(start.getTime() + 60 * 60_000);
        const day = Math.floor((start.getTime() - weekStart.getTime()) / 86_400_000);
        const hour = start.getHours() + start.getMinutes() / 60;
        const duration = Math.max(0.5, (end.getTime() - start.getTime()) / 3_600_000);
        return {
          id: booking.id,
          day,
          hour,
          duration,
          label: `${booking.service_name} · ${(booking.profiles?.full_name ?? "Client").split(" ")[0]}`,
          price: Number(booking.price),
        };
      })
      .filter((slot) => slot.day >= 0 && slot.day < 7 && slot.hour >= 8 && slot.hour < 20);
  }, [bookings, weekStart]);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Calendar className="w-7 h-7 text-emerald-600" /> Mon agenda
            </h1>
            <p className="text-muted-foreground mt-1">
              Semaine du {weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} au {new Date(weekEnd.getTime() - 1).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} · {slots.length} RDV confirmés
            </p>
          </div>
          <Link
            to="/pro/demandes"
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
          >
            <Inbox className="w-4 h-4" /> Voir demandes
          </Link>
        </div>

        <div className="mt-6 bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-secondary/50">
            <div />
            {week.map((d) => (
              <div key={d.date.toISOString()} className="px-2 py-3 text-xs font-semibold text-center">{d.label}</div>
            ))}
          </div>
          {isLoading && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Loader2 className="w-6 h-6 mx-auto animate-spin" />
              <p className="mt-2">Chargement de l'agenda…</p>
            </div>
          )}
          {!isLoading && <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            <div className="border-r border-border">
              {HOURS.map((h) => (
                <div key={h} className="h-14 px-2 py-1 text-[10px] text-muted-foreground border-b border-border">{h}</div>
              ))}
            </div>
            {week.map((_, dayIdx) => (
              <div key={dayIdx} className="border-r border-border last:border-r-0 relative">
                {HOURS.map((h, hIdx) => (
                  <div
                    key={h}
                    className="h-14 w-full border-b border-border"
                  />
                ))}
                {slots.filter((s) => s.day === dayIdx).map((s) => (
                  <div
                    key={s.id}
                    className="absolute left-1 right-1 bg-emerald-500 text-white rounded-lg p-1.5 text-[10px] font-medium shadow-soft group"
                    style={{ top: (s.hour - 8) * 56 + 2, height: s.duration * 56 - 4 }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="truncate">{s.label}</div>
                    </div>
                    <div className="text-[9px] opacity-80">{s.price} €</div>
                  </div>
                ))}
              </div>
            ))}
          </div>}
        </div>
      </div>
    </AppLayout>
  );
}
