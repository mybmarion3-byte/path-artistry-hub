import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker, getPro } from "@/lib/booker-store";
import {
  Calendar, Clock, MapPin, TrendingUp, Wallet, Users, Inbox, Check, X,
  ArrowRight, Star, Zap, Home as HomeIcon,
} from "lucide-react";
import { toast } from "sonner";
import mapBg from "@/assets/map-paris.jpg";

export const Route = createFileRoute("/pro")({
  head: () => ({
    meta: [
      { title: "Tableau de bord pro — Booker 2030" },
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



function ProDashboard() {
  const proIdentityId = useBooker((s) => s.proIdentityId);
  const pro = getPro(proIdentityId);
  const proInbox = useBooker((s) => s.proInbox);
  const accept = useBooker((s) => s.acceptProRequest);
  const decline = useBooker((s) => s.declineProRequest);
  const proVisible = useBooker((s) => s.proVisible);
  const setProVisible = useBooker((s) => s.setProVisible);
  const pushNotification = useBooker((s) => s.pushNotification);
  const agenda = useBooker((s) => s.proAgenda);
  const addAgenda = useBooker((s) => s.addAgendaSlot);

  const today = agenda.filter((a) => a.day === 0).sort((a, b) => a.hour - b.hour);
  const nowHour = new Date().getHours();
  const todayWithStatus = today.map((a) => ({
    ...a,
    status: a.hour + a.dur <= nowHour ? "done" : a.hour <= nowHour + 1 ? "next" : "upcoming",
  })) as Array<(typeof today)[number] & { status: "done" | "next" | "upcoming" }>;

  const pending = proInbox.filter((r) => r.status === "pending");
  const todayRevenue = todayWithStatus.filter((a) => a.status === "done").reduce((s, a) => s + a.price, 0);
  const dayTotal = todayWithStatus.reduce((s, a) => s + a.price, 0);

  function handleAccept(id: string) {
    const req = proInbox.find((r) => r.id === id);
    if (!req) return;
    accept(id);
    addAgenda({
      day: req.when.toLowerCase().startsWith("demain") ? 1 : 0,
      hour: 17,
      dur: 1,
      label: `${req.serviceName} · ${req.clientName.split(" ")[0]}`,
      clientName: req.clientName,
      serviceName: req.serviceName,
      price: req.price,
    });
    pushNotification({ title: "Demande acceptée", body: `${req.serviceName} — ${req.clientName}` });
    toast.success(`Demande de ${req.clientName} acceptée`);
  }

  function handleDecline(id: string) {
    decline(id);
    toast("Demande déclinée");
  }

  function toggleVisibility() {
    const next = !proVisible;
    setProVisible(next);
    toast(next ? "Vous êtes visible · disponible maintenant" : "Visibilité désactivée");
  }


  return (
    <AppLayout>
      <div className="p-8 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={pro.avatar} alt={pro.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500" />
            <div>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
              <h1 className="text-3xl font-semibold">Bonjour {pro.name.split(" ")[0]} 👋</h1>
              <div className="text-sm text-muted-foreground mt-0.5">
                {today.length} rendez-vous aujourd'hui · {dayTotal} € prévus
              </div>
            </div>
          </div>
          <button
            onClick={() => setProVisible(!proVisible)}
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

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <Kpi icon={Calendar} label="RDV aujourd'hui" value={`${today.length}`} sub={`${todayWithStatus.filter((a) => a.status === "done").length} terminés`} />
          <Kpi icon={Wallet} label="Revenu du jour" value={`${todayRevenue} €`} sub={`/ ${dayTotal} € prévus`} accent />
          <Kpi icon={Inbox} label="Demandes en attente" value={`${pending.length}`} sub="à traiter" />
          <Kpi icon={TrendingUp} label="Cette semaine" value="+18%" sub="vs sem. dernière" />
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
              {pending.map((r) => (
                <div key={r.id} className="border border-border rounded-2xl p-4 hover:border-emerald-500/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-sm">{r.serviceName}</span>
                        <span className="text-xs text-muted-foreground">· {r.clientName}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location} · {r.distanceKm} km</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.when}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold">{r.price} €</div>
                      <div className="text-[10px] text-muted-foreground">budget</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAccept(r.id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Accepter
                    </button>
                    <button
                      onClick={() => handleDecline(r.id)}
                      className="px-4 border border-border rounded-xl text-sm hover:bg-secondary flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Décliner
                    </button>
                  </div>
                </div>
              ))}
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
              <Stat label="Rayon" value="5 km" />
              <Stat label="Clients actifs" value="42" />
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
              <img src={pro.avatar} alt="" className="w-12 h-12 rounded-full border-4 border-emerald-500 object-cover" />
            </div>
            {/* client pins */}
            {[
              { x: "40%", y: "35%", label: "Sophie · 09h" },
              { x: "62%", y: "44%", label: "Anna · 10h30" },
              { x: "52%", y: "62%", label: "Marion · 14h", active: true },
              { x: "36%", y: "58%", label: "Camille · 16h" },
            ].map((p, i) => (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
                <div className={`px-2 py-1 rounded-full text-[10px] font-semibold shadow-card ${
                  p.active ? "bg-emerald-500 text-white" : "bg-card border border-border"
                }`}>
                  📍 {p.label}
                </div>
              </div>
            ))}
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-xl px-3 py-2 text-xs border border-border shadow-card">
              <div className="font-semibold flex items-center gap-1"><HomeIcon className="w-3 h-3" /> 4 clients aujourd'hui</div>
              <div className="text-muted-foreground mt-0.5">Trajet total estimé : 42 min</div>
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
