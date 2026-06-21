import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home, CalendarCheck, MessageSquare, Heart, CreditCard, Star, Calendar,
  BarChart3, Settings, Sparkles, ArrowRight, LayoutDashboard, Inbox,
  Users, Scissors, Wallet, MapPin, UserCircle, Briefcase,
} from "lucide-react";
import { useBooker } from "@/lib/booker-store";

type ClientPath = "/" | "/reservations" | "/messages" | "/favoris" | "/paiements" | "/avis" | "/calendrier" | "/analyses" | "/parametres";
type ProPath = "/pro" | "/pro/demandes" | "/pro/agenda" | "/pro/clients" | "/pro/prestations" | "/pro/revenus" | "/pro/messages" | "/pro/parametres";

const clientNav: { to: ClientPath; label: string; icon: typeof Home; badge?: string }[] = [
  { to: "/", label: "Rechercher", icon: Home },
  { to: "/reservations", label: "Mes réservations", icon: CalendarCheck },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/favoris", label: "Favoris", icon: Heart },
  { to: "/paiements", label: "Paiements", icon: CreditCard },
  { to: "/avis", label: "Mes avis", icon: Star },
  { to: "/calendrier", label: "Calendrier", icon: Calendar },
  { to: "/analyses", label: "Analyses", icon: BarChart3, badge: "NOUVEAU" },
  { to: "/parametres", label: "Paramètres", icon: Settings },
];

const proNav: { to: ProPath; label: string; icon: typeof Home; badge?: string | number }[] = [
  { to: "/pro", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/pro/demandes", label: "Demandes entrantes", icon: Inbox },
  { to: "/pro/agenda", label: "Mon agenda", icon: Calendar },
  { to: "/pro/clients", label: "Mes clients", icon: Users },
  { to: "/pro/prestations", label: "Mes prestations", icon: Scissors },
  { to: "/pro/revenus", label: "Revenus", icon: Wallet },
  { to: "/pro/messages", label: "Messages clients", icon: MessageSquare },
  { to: "/pro/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = useBooker((s) => s.role);
  const setRole = useBooker((s) => s.setRole);
  const navigate = useNavigate();
  const unread = useBooker((s) =>
    s.role === "client"
      ? s.messages.filter((m) => m.from === "pro").length
      : s.proMessages.filter((m) => m.from === "client").length,
  );
  const inboxCount = useBooker((s) => s.proInbox.filter((r) => r.status === "pending").length);

  const isClient = role === "client";
  const nav = isClient ? clientNav : proNav;

  function switchTo(r: "client" | "pro") {
    setRole(r);
    navigate({ to: r === "client" ? "/" : "/pro" });
  }

  return (
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-glow ${
          isClient ? "bg-gradient-primary" : "bg-gradient-to-br from-emerald-500 to-teal-600"
        }`}>
          B
        </div>
        <div className="font-semibold text-lg">
          Booker <span className="text-muted-foreground font-normal">&nbsp;NoW</span>
        </div>
      </div>

      {/* Role switch */}
      <div className="mx-3 mb-3 p-1 rounded-xl bg-secondary flex gap-1">
        <button
          onClick={() => switchTo("client")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            isClient ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCircle className="w-3.5 h-3.5" /> Client
        </button>
        <button
          onClick={() => switchTo("pro")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            !isClient ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Pro
        </button>
      </div>

      <div className={`mx-3 mb-2 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase ${
        isClient ? "text-primary" : "text-emerald-600"
      }`}>
        {isClient ? "Espace client" : "Espace professionnel"}
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          const isMessages = item.to === "/messages" || item.to === "/pro/messages";
          const isInbox = item.to === "/pro/demandes";
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gradient-primary text-primary-foreground">
                  {item.badge}
                </span>
              )}
              {isMessages && unread > 0 && (
                <span className="text-[11px] font-semibold w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {unread}
                </span>
              )}
              {isInbox && inboxCount > 0 && (
                <span className="text-[11px] font-semibold w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  {inboxCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-3">
        {isClient ? (
          <>
            <div className="rounded-2xl p-4 bg-gradient-soft border border-accent">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                Booker AI <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                Votre assistant personnel pour trouver le pro parfait.
              </p>
            </div>
            <div className="rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5">
              <div className="text-sm font-semibold">Devenez pro</div>
              <p className="text-xs text-muted-foreground mt-1">
                +300% de réservations en moyenne
              </p>
              <button
                onClick={() => switchTo("pro")}
                className="mt-3 w-full border border-emerald-500/40 text-emerald-600 text-sm font-medium rounded-lg py-2 hover:bg-emerald-500/10 transition flex items-center justify-center gap-1"
              >
                Basculer en pro <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <MapPin className="w-4 h-4 text-emerald-600" /> Zone d'intervention
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
              Paris 17e · rayon 5 km · 12 demandes cette semaine.
            </p>
            <Link
              to="/pro"
              className="mt-3 block text-center w-full bg-emerald-500 text-white text-sm font-medium rounded-lg py-2 hover:bg-emerald-600 transition"
            >
              Optimiser ma zone
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
