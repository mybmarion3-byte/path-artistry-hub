import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/app/AppLayout";
import { getClientAnalytics } from "@/lib/analytics.functions";
import { Calendar, Euro, Heart, Inbox, Loader2, MessageSquare, Star, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/analyses")({
  head: () => ({ meta: [{ title: "Analyses — Booker NoW" }] }),
  component: Page,
});

type MonthlyPoint = {
  key: string;
  label: string;
  count: number;
  spent: number;
};

type CategoryPoint = {
  label: string;
  count: number;
  percent: number;
};

type AnalyticsPayload = {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookedAmount: number;
  uniquePros: number;
  favoritesCount: number;
  reviewsCount: number;
  avgRating: number | null;
  messagesCount: number;
  monthlySeries: MonthlyPoint[];
  categoryBreakdown: CategoryPoint[];
  insights: string[];
  trends: {
    bookings: string;
    bookedAmount: string;
    uniquePros: string;
    avgRating: string;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildChartPoints(series: MonthlyPoint[]) {
  const max = Math.max(...series.map((point) => point.count), 1);
  const divisor = Math.max(series.length - 1, 1);

  return series
    .map((point, index) => {
      const x = (index * 600) / divisor;
      const y = 190 - (point.count / max) * 160;

      return `${x},${y}`;
    })
    .join(" ");
}

function Page() {
  const fetchAnalytics = useServerFn(getClientAnalytics);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["analytics", "client"],
    queryFn: () => fetchAnalytics(),
  });

  const analytics = data as AnalyticsPayload | undefined;
  const chartPoints = buildChartPoints(analytics?.monthlySeries ?? []);

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">Analyses</h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gradient-primary text-primary-foreground">
            SUPABASE
          </span>
        </div>
        <p className="text-muted-foreground mt-1">Comprenez vos habitudes à partir de vos vraies données Booker.</p>

        {isLoading && (
          <div className="bg-card border border-border rounded-3xl p-10 mt-6 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto animate-spin" />
            <p className="text-sm mt-3">Chargement des analyses…</p>
          </div>
        )}

        {!isLoading && isError && (
          <div className="bg-card border border-border rounded-3xl p-10 mt-6 text-center">
            <Inbox className="w-10 h-10 mx-auto text-muted-foreground" />
            <h2 className="font-semibold mt-3">Impossible de charger les analyses</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Une erreur est survenue."}
            </p>
          </div>
        )}

        {!isLoading && !isError && analytics && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <KPI icon={Calendar} label="Réservations" value={String(analytics.totalBookings)} trend={analytics.trends.bookings} />
              <KPI icon={Euro} label="Montant réservé" value={formatCurrency(analytics.bookedAmount)} trend={analytics.trends.bookedAmount} />
              <KPI icon={Users} label="Pros utilisés" value={String(analytics.uniquePros)} trend={analytics.trends.uniquePros} />
              <KPI icon={Star} label="Note moyenne" value={analytics.avgRating ? String(analytics.avgRating) : "—"} trend={analytics.trends.avgRating} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <MiniKPI label="À venir / en attente" value={analytics.activeBookings} />
              <MiniKPI label="Terminées" value={analytics.completedBookings} />
              <MiniKPI label="Annulées" value={analytics.cancelledBookings} />
              <MiniKPI label="Favoris" value={analytics.favoritesCount} icon={Heart} />
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 mt-6 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Évolution des réservations</h2>
                  <p className="text-xs text-muted-foreground mt-1">12 derniers mois</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {analytics.messagesCount} message{analytics.messagesCount > 1 ? "s" : ""}
                </div>
              </div>

              <svg viewBox="0 0 600 220" className="w-full mt-4 h-52">
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.22 285)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="oklch(0.58 0.22 285)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <polyline
                  fill="none"
                  stroke="oklch(0.58 0.22 285)"
                  strokeWidth="3"
                  points={chartPoints}
                />

                <polygon
                  fill="url(#analyticsGradient)"
                  points={`0,220 ${chartPoints} 600,220`}
                />

                {analytics.monthlySeries.map((point, index) => (
                  <text
                    key={point.key}
                    x={(index * 600) / Math.max(analytics.monthlySeries.length - 1, 1)}
                    y="216"
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {point.label}
                  </text>
                ))}
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
                <h3 className="font-semibold">Catégories préférées</h3>

                {analytics.categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-4">
                    Les catégories apparaîtront après vos premières réservations.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {analytics.categoryBreakdown.map((category) => (
                      <div key={category.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category.label}</span>
                          <span className="text-muted-foreground">{category.percent}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-primary" style={{ width: `${category.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
                <h3 className="font-semibold">Insights</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {analytics.insights.map((insight) => (
                    <li key={insight} className="flex gap-2">
                      <span className="text-primary">●</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                  <li className="flex gap-2">
                    <MessageSquare className="w-4 h-4 text-primary mt-0.5" />
                    <span>{analytics.messagesCount} message{analytics.messagesCount > 1 ? "s" : ""} lié{analytics.messagesCount > 1 ? "s" : ""} à vos conversations.</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function KPI({ icon: Icon, label, value, trend }: { icon: LucideIcon; label: string; value: string; trend: string }) {
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

function MiniKPI({ label, value, icon: Icon = TrendingUp }: { label: string; value: number; icon?: LucideIcon }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">{value}</div>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
