import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { listProBookings } from "@/lib/bookings.functions";
import { useBooker } from "@/lib/booker-store";
import { Wallet, TrendingUp, Download, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/revenus")({
  head: () => ({ meta: [{ title: "Revenus — Booker Pro" }] }),
  component: Page,
});

type BookingRow = {
  id: string;
  service_name: string;
  start_at: string;
  price: number | string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  profiles?: {
    full_name: string | null;
  } | null;
};

type MonthRevenue = {
  key: string;
  m: string;
  v: number;
  bookingCount: number;
};

const REVENUE_STATUSES = ["confirmed", "completed"] as const;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  const label = date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildMonthBuckets(count: number) {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - count + 1, 1);

  return Array.from({ length: count }, (_, index): MonthRevenue => {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);

    return {
      key: monthKey(date),
      m: formatMonthLabel(date),
      v: 0,
      bookingCount: 0,
    };
  });
}

function toRevenueAmount(value: number | string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function Page() {
  const period = useBooker((s) => s.revenuePeriod);
  const setPeriod = useBooker((s) => s.setRevenuePeriod);
  const fetchBookings = useServerFn(listProBookings);

  const n = period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ["bookings", "pro", "revenus"],
    queryFn: () => fetchBookings(),
  });

  const revenueBookings = useMemo(() => {
    const rows = bookings as BookingRow[];

    return rows.filter((booking) =>
      REVENUE_STATUSES.includes(booking.status as (typeof REVENUE_STATUSES)[number]),
    );
  }, [bookings]);

  const months = useMemo(() => {
    const buckets = buildMonthBuckets(n);
    const byMonth = new Map(buckets.map((month) => [month.key, month]));

    for (const booking of revenueBookings) {
      const start = new Date(booking.start_at);
      if (Number.isNaN(start.getTime())) continue;

      const bucket = byMonth.get(monthKey(start));
      if (!bucket) continue;

      bucket.v += toRevenueAmount(booking.price);
      bucket.bookingCount += 1;
    }

    return buckets;
  }, [n, revenueBookings]);

  const total = months.reduce((sum, month) => sum + month.v, 0);
  const bookingCount = months.reduce((sum, month) => sum + month.bookingCount, 0);
  const max = Math.max(...months.map((month) => month.v), 1);
  const last = months[months.length - 1]?.v ?? 0;
  const prev = months[months.length - 2]?.v ?? 0;
  const delta = prev === 0 ? (last > 0 ? 100 : 0) : Math.round(((last - prev) / prev) * 100);

  function exportCSV() {
    const csv = [
      "Mois,Revenu (EUR),Réservations",
      ...months.map((month) => `${month.m},${month.v},${month.bookingCount}`),
    ].join("\n");

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
                  {p === "3m" ? "3 mois" : p === "6m" ? "6 mois" : "12 mois"}             </button>
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
            <div className="text-xs font-semibold text-muted-foreground uppercase">Réservations comptées</div>
            <div className="text-3xl font-semibold mt-2">{bookingCount}</div>
            <div className="text-xs text-muted-foreground mt-1">confirmées ou terminées</div>
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground shadow-soft">
            <Loader2 className="w-8 h-8 mx-auto animate-spin" />
            <p className="text-sm mt-3">Chargement des revenus…</p>
          </div>
        )}

        {!isLoading && isError && (
          <div className="mt-6 bg-card border border-border rounded-3xl p-12 text-center shadow-soft">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold mt-3">Impossible de charger les revenus</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {error instanceof Error ? error.message : "Une erreur est survenue pendant le chargement."}
            </p>
          </div>
        )}

        {!isLoading && !isError && revenueBookings.length === 0 && (
          <div className="mt-6 bg-card border border-border rounded-3xl p-12 text-center shadow-soft">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold mt-3">Aucun revenu pour le moment</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Les revenus apparaîtront ici après des réservations confirmées ou terminées.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="mt-6 bg-card border border-border rounded-3xl p-6 shadow-soft">
            <h2 className="text-sm font-semibold mb-5">Évolution mensuelle</h2>
            <div className="flex items-end gap-4 h-56">
              {months.map((month) => (
                <div key={month.key} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold tabular-nums">{month.v.toLocaleString("fr-FR")} €</div>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all"
                    style={{ height: `${(month.v / max) * 100}%` }}
                  />
                  <div className="text-xs text-muted-foreground">{month.m}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
