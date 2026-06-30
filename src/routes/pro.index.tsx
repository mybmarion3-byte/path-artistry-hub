import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker } from "@/lib/booker-store";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { useProActivityBlocks } from "@/hooks/use-pro-activity-blocks";
import { useProLocations } from "@/hooks/use-pro-locations";
import { useProServices } from "@/hooks/use-pro-services";
import { listProBookings, updateProBookingStatus } from "@/lib/bookings.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Calendar, Clock, MapPin, TrendingUp, Wallet, Users, Inbox, Check, X,
  ArrowRight, Star, Zap, Home as HomeIcon,
} from "lucide-react";
import { toast } from "sonner";
import mapBg from "@/assets/map-paris.jpg";

export const Route = createFileRoute("/pro/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord pro — Booker NoW" },
      { name: "description", content: "Espace professionnel : agenda, demandes entrantes, zone d'intervention et revenus." },
    ],
  }),
  component: ProDashboard,
});

function fmtHour(h: number) {
  const hh = Math.floor(h);
  const mm = (h - hh) * 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

type BookingRow = {
  id: string;
  client_id: string;
  service_name: string;
  address_text: string | null;
  mode: string;
  start_at: string;
  end_at: string | null;
  price: number | string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  phone: string | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
  } | null;
  client_addresses?: {
    label: string | null;
    address: string | null;
    kind: string | null;
  } | null;
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatBookingDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }) +
    " · " +
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}



function ProDashboard() {
  const proVisible = useBooker((s) => s.proVisible);
  const setProVisible = useBooker((s) => s.setProVisible);
  const { pro, loading: profileLoading, error: profileError } = useCurrentUserProfile();
  const { services, loading: servicesLoading } = useProServices(pro?.id);
  const { locations, loading: locationsLoading } = useProLocations(pro?.id);
  const { blocks, loading: blocksLoading } = useProActivityBlocks(pro?.id);
  const fetchBookings = useServerFn(listProBookings);
  const updateStatus = useServerFn(updateProBookingStatus);
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", "pro", "dashboard"],
    queryFn: () => fetchBookings(),
    enabled: !!pro?.id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "confirmed" | "cancelled" }) =>
      updateStatus({ data: { id, status } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "pro"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "pro", "agenda"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "pro", "dashboard"] });
      toast.success(variables.status === "confirmed" ? "Demande acceptée" : "Demande déclinée");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour la demande"),
  });

  const rows = bookings as BookingRow[];
  const now = new Date();
  const todayBookings = rows
    .filter((booking) => isSameDay(new Date(booking.start_at), now))
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const todayWithStatus = todayBookings
    .filter((booking) => booking.status === "confirmed" || booking.status === "completed")
    .map((booking) => {
      const start = new Date(booking.start_at);
      const end = booking.end_at ? new Date(booking.end_at) : new Date(start.getTime() + 60 * 60_000);
      const hour = start.getHours() + start.getMinutes() / 60;
      const duration = Math.max(0.5, (end.getTime() - start.getTime()) / 3_600_000);
      return {
        id: booking.id,
        hour,
        dur: duration,
        clientName: booking.profiles?.full_name ?? "Client",
        serviceName: booking.service_name,
        price: Number(booking.price),
        status:
          booking.status === "completed" || end.getTime() <= now.getTime()
            ? "done"
            : start.getTime() <= now.getTime() + 60 * 60_000
              ? "next"
              : "upcoming",
      };
    }) as Array<{
      id: string;
      hour: number;
      dur: number;
      clientName: string;
      serviceName: string;
      price: number;
      status: "done" | "next" | "upcoming";
    }>;

  const pending = rows.filter((booking) => booking.status === "pending");
  const activeClientCount = new Set(
    rows
      .filter((booking) => booking.status === "pending" || booking.status === "confirmed")
      .map((booking) => booking.client_id)
      .filter(Boolean),
  ).size;
  const primaryLocation = locations.find((location) => location.is_primary) ?? locations[0];
  const radiusLabel = primaryLocation ? `${primaryLocation.travel_radius_km} km` : "À définir";
  const todayRevenue = todayWithStatus.filter((a) => a.status === "done").reduce((s, a) => s + a.price, 0);
  const dayTotal = todayWithStatus.reduce((s, a) => s + a.price, 0);
  const publicProfileReady = Boolean(
    pro?.name?.trim() &&
    pro?.job?.trim() &&
    pro?.category?.trim() &&
    pro?.specialty?.trim() &&
    pro?.bio?.trim() &&
    Number(pro?.starting_price ?? 0) > 0 &&
    (pro?.modes?.length ?? 0) > 0,
  );
  const onboardingLoading = servicesLoading || locationsLoading || blocksLoading;
  const onboardingSteps = [
    {
      label: "Profil public",
      desc: "Nom, métier, catégorie, spécialité, bio, prix et modes.",
      done: publicProfileReady,
      to: "/pro/parametres",
      action: publicProfileReady ? "Vérifier" : "Compléter",
    },
    {
      label: "Prestations",
      desc: "Au moins une prestation active avec durée et prix.",
      done: services.length > 0,
      to: "/pro/prestations",
      action: services.length > 0 ? "Gérer" : "Ajouter",
    },
    {
      label: "Lieux",
      desc: "Adresse, zone ou lieu de départ pour les rendez-vous.",
      done: locations.length > 0,
      to: "/pro/disponibilites",
      action: locations.length > 0 ? "Vérifier" : "Renseigner",
    },
    {
      label: "Disponibilités",
      desc: "Créneaux actifs pour recevoir des demandes cohérentes.",
      done: blocks.length > 0,
      to: "/pro/disponibilites",
      action: blocks.length > 0 ? "Ajuster" : "Planifier",
    },
  ] as const;
  const onboardingDone = onboardingSteps.filter((step) => step.done).length;
  const onboardingCompletion = Math.round((onboardingDone / onboardingSteps.length) * 100);

  function handleAccept(id: string) {
    statusMutation.mutate({ id, status: "confirmed" });
  }

  function handleDecline(id: string) {
    statusMutation.mutate({ id, status: "cancelled" });
  }

  function toggleVisibility() {
    const next = !proVisible;
    setProVisible(next);
    toast(next ? "Vous êtes visible · disponible maintenant" : "Visibilité désactivée");
  }

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground">Chargement de votre espace pro...</div>
      </AppLayout>
    );
  }

  if (profileError || !pro) {
    return (
      <AppLayout>
        <div className="p-8 max-w-3xl">
          <h1 className="text-3xl font-semibold">Espace pro</h1>
          <p className="text-muted-foreground mt-2">
            {profileError ?? "Ce compte n'est pas encore relié à une fiche professionnelle."}
          </p>
          <Link
            to="/pro/parametres"
            className="inline-block mt-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            Compléter mon profil pro
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {pro.avatar_url ? (
              <img src={pro.avatar_url} alt={pro.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500" />
            ) : (
              <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center text-xl font-semibold">
                {pro.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
              <h1 className="text-3xl font-semibold">Bonjour {pro.name.split(" ")[0]}</h1>
              <div className="text-sm text-muted-foreground mt-0.5">
                {bookingsLoading ? "Chargement..." : `${todayWithStatus.length} rendez-vous aujourd'hui · ${dayTotal} € prévus`}
              </div>
            </div>
          </div>
          <button
            onClick={toggleVisibility}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition ${
              proVisible
                ? "bg-emerald-500 text-white shadow-glow hover:bg-emerald-600"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${proVisible ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
            {proVisible ? "Visible · Disponible maintenant" : "Activer ma visibilité"}
          </button>
        </div>

        <section className="bg-card border border-border rounded-3xl p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Prêt à recevoir des clients</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Booker utilise ces informations pour afficher votre profil, proposer les bons créneaux et éviter les réservations incohérentes.
              </p>
            </div>
            <div className="min-w-40">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{onboardingLoading ? "Vérification..." : `${onboardingDone}/${onboardingSteps.length} étapes`}</span>
                <span className="text-emerald-700">{onboardingCompletion}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${onboardingCompletion}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
            {onboardingSteps.map((step) => (
              <Link
                key={step.label}
                to={step.to}
                className={`rounded-2xl border p-4 transition hover:border-emerald-500/50 ${
                  step.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{step.label}</div>
                    <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                  </div>
                  <span className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${
                    step.done ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  {step.action} <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <Kpi icon={Calendar} label="RDV aujourd'hui" value={`${todayWithStatus.length}`} sub={`${todayWithStatus.filter((a) => a.status === "done").length} terminés`} />
          <Kpi icon={Wallet} label="Revenu du jour" value={`${todayRevenue} €`} sub={`/ ${dayTotal} € prévus`} accent />
          <Kpi icon={Inbox} label="Demandes en attente" value={`${pending.length}`} sub="à traiter" />
          <Kpi icon={TrendingUp} label="Cette semaine" value={`${rows.filter((b) => b.status === "confirmed" || b.status === "completed").length}`} sub="réservations actives" />
        </div>

        {/* Grid: demandes + agenda */}
        <div className="grid grid-cols-[1fr_1fr] gap-6">
          {/* Demandes entrantes */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-emerald-600" /> Demandes entrantes
                </h2>
                <p className="text-xs text-muted-foreground">Acceptez vite, le premier qui répond gagne.</p>
              </div>
              <Link to="/pro/demandes" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {pending.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">Aucune demande en attente.</div>
              )}
              {pending.map((r) => {
                const addressText = r.client_addresses?.address ?? r.address_text ?? r.mode;
                const clientName = r.profiles?.full_name ?? "Client";
                return (
                <div key={r.id} className="border border-border rounded-2xl p-4 hover:border-emerald-500/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-sm">{r.service_name}</span>
                        <span className="text-xs text-muted-foreground">· {clientName}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {addressText}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatBookingDate(r.start_at)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold">{Number(r.price).toFixed(0)} €</div>
                      <div className="text-[10px] text-muted-foreground">budget</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={statusMutation.isPending}
                      onClick={() => handleAccept(r.id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Accepter
                    </button>
                    <button
                      disabled={statusMutation.isPending}
                      onClick={() => handleDecline(r.id)}
                      className="px-4 border border-border rounded-xl text-sm hover:bg-secondary disabled:opacity-60 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Décliner
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          </section>

          {/* Agenda du jour */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" /> Agenda du jour
                </h2>
                <p className="text-xs text-muted-foreground">Vos rendez-vous avec trajets optimisés.</p>
              </div>
              <Link to="/pro/agenda" className="text-xs font-semibold text-emerald-600 hover:underline">Semaine</Link>
            </div>
            <div className="space-y-2">
              {todayWithStatus.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">Aucun RDV aujourd'hui.</div>
              )}
              {todayWithStatus.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    a.status === "next"
                      ? "border-emerald-500 bg-emerald-50/60"
                      : a.status === "done"
                      ? "border-border opacity-60"
                      : "border-border"
                  }`}
                >
                  <div className="w-14 text-sm font-semibold tabular-nums">{fmtHour(a.hour)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.clientName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.serviceName} · {Math.round(a.dur * 60)} min
                    </div>
                  </div>
                  {a.price > 0 && <div className="text-sm font-semibold">{a.price} €</div>}
                  {a.status === "next" && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">PROCHAIN</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Zone d'intervention */}
        <section className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          <div className="p-6 pb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Ma zone d'intervention
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Visualisez vos clients du jour et les zones de forte demande.
              </p>
            </div>
            <div className="flex gap-2">
              <Stat label="Rayon" value={radiusLabel} />
              <Stat label="Clients actifs" value={String(activeClientCount)} />
              <Stat label="Note moy." value={pro.rating.toFixed(1)} icon={<Star className="w-3 h-3 fill-warning text-warning" />} />
            </div>
          </div>
          <div className="relative h-72 mx-6 mb-6 rounded-2xl overflow-hidden border border-border">
            <img src={mapBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
            {/* coverage circle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-64 h-64 rounded-full border-2 border-emerald-500/60 bg-emerald-500/10" />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {pro.avatar_url ? (
                <img src={pro.avatar_url} alt="" className="w-12 h-12 rounded-full border-4 border-emerald-500 object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center font-semibold">
                  {pro.name.charAt(0)}
                </div>
              )}
            </div>
            {/* client pins */}
            {todayBookings.slice(0, 4).map((booking, i) => {
              const start = new Date(booking.start_at);
              const clientName = booking.profiles?.full_name?.split(" ")[0] ?? "Client";
              const pins = [
                { x: "40%", y: "35%" },
                { x: "62%", y: "44%" },
                { x: "52%", y: "62%" },
                { x: "36%", y: "58%" },
              ];
              const p = pins[i] ?? pins[0];
              return (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
                <div className={`px-2 py-1 rounded-full text-[10px] font-semibold shadow-card ${
                  booking.status === "confirmed" ? "bg-emerald-500 text-white" : "bg-card border border-border"
                }`}>
                  📍 {clientName} · {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              );
            })}
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-xl px-3 py-2 text-xs border border-border shadow-card">
              <div className="font-semibold flex items-center gap-1"><HomeIcon className="w-3 h-3" /> {todayBookings.length} clients aujourd'hui</div>
              <div className="text-muted-foreground mt-0.5">Demandes et RDV issus de Supabase</div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Kpi({
  icon: Icon, label, value, sub, accent,
}: { icon: typeof Calendar; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border shadow-soft ${
      accent ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-500" : "bg-card border-border"
    }`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-white/80" : "text-muted-foreground"}`}>
          {label}
        </div>
        <Icon className={`w-4 h-4 ${accent ? "text-white/80" : "text-emerald-600"}`} />
      </div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-white/80" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="px-3 py-2 rounded-xl border border-border text-center">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold flex items-center justify-center gap-1 mt-0.5">{icon}{value}</div>
    </div>
  );
}
