import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Home,
  CalendarCheck,
  MessageSquare,
  Heart,
  CreditCard,
  Star,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Inbox,
  Users,
  Scissors,
  Wallet,
  MapPin,
  UserCircle,
  Briefcase,
} from "lucide-react";

import { useBooker } from "@/lib/booker-store";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { useProLocations } from "@/hooks/use-pro-locations";
import { listProBookings } from "@/lib/bookings.functions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ClientPath =
  | "/"
  | "/reservations"
  | "/messages"
  | "/favoris"
  | "/paiements"
  | "/avis"
  | "/calendrier"
  | "/analyses"
  | "/parametres";

type ProPath =
  | "/pro"
  | "/pro/demandes"
  | "/pro/agenda"
  | "/pro/disponibilites"
  | "/pro/clients"
  | "/pro/prestations"
  | "/pro/revenus"
  | "/pro/messages"
  | "/pro/parametres";

const clientNav: {
  to: ClientPath;
  label: string;
  icon: typeof Home;
  badge?: string;
}[] = [
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

const proNav: {
  to: ProPath;
  label: string;
  icon: typeof Home;
  badge?: string | number;
}[] = [
  { to: "/pro", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/pro/demandes", label: "Demandes entrantes", icon: Inbox },
  { to: "/pro/agenda", label: "Mon agenda", icon: Calendar },
  {
    to: "/pro/disponibilites",
    label: "Disponibilités",
    icon: CalendarCheck,
    badge: "NOUVEAU",
  },
  { to: "/pro/clients", label: "Mes clients", icon: Users },
  { to: "/pro/prestations", label: "Mes prestations", icon: Scissors },
  { to: "/pro/revenus", label: "Revenus", icon: Wallet },
  { to: "/pro/messages", label: "Messages clients", icon: MessageSquare },
  { to: "/pro/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
} = {}) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const role = useBooker((s) => s.role);
  const setRole = useBooker((s) => s.setRole);
  const navigate = useNavigate();
  const fetchProBookings = useServerFn(listProBookings);
  const { pro } = useCurrentUserProfile();
  const { locations } = useProLocations(pro?.id);

  const isClient = role === "client";
  const { data: proBookings = [] } = useQuery({
    queryKey: ["bookings", "pro", "sidebar"],
    queryFn: () => fetchProBookings(),
    enabled: !isClient,
  });
  const unread = 0;
  const inboxCount = (proBookings as Array<{ status: string }>).filter(
    (booking) => booking.status === "pending",
  ).length;
  const primaryLocation = locations.find((item) => item.is_primary) ?? locations[0];
  const zoneSummary = primaryLocation
    ? `${primaryLocation.city || primaryLocation.name} · rayon ${primaryLocation.travel_radius_km} km`
    : "Zone à définir";
  const nav = isClient ? clientNav : proNav;
  const showLabels = !collapsed || isHovered;

  function switchTo(r: "client" | "pro") {
    setRole(r);
    navigate({ to: r === "client" ? "/" : "/pro" });
    onNavigate?.();
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        onMouseEnter={() => collapsed && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${
          showLabels ? "w-64 shadow-xl z-40" : "w-16"
        } fixed left-0 top-0 h-screen shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-200 ease-in-out`}
      >
        <div
          className={`${
            !showLabels ? "px-3" : "px-6"
          } pt-6 pb-4 flex items-center gap-2`}
        >
          <div
            className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-glow ${
              isClient
                ? "bg-gradient-primary"
                : "bg-gradient-to-br from-emerald-500 to-teal-600"
            }`}
          >
            B
          </div>

          {showLabels && (
            <div className="font-semibold text-lg animate-fade-in whitespace-nowrap">
              Booker <span className="text-muted-foreground font-normal">NoW</span>
            </div>
          )}
        </div>

        {!showLabels ? (
          <div className="mx-2 mb-3 flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => switchTo("client")}
                  className={`h-9 rounded-lg flex items-center justify-center transition ${
                    isClient
                      ? "bg-card shadow-soft text-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Espace Client</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => switchTo("pro")}
                  className={`h-9 rounded-lg flex items-center justify-center transition ${
                    !isClient
                      ? "bg-card shadow-soft text-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Espace Pro</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="mx-3 mb-3 p-1 rounded-xl bg-secondary flex gap-1 animate-fade-in">
            <button
              onClick={() => switchTo("client")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                isClient
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCircle className="w-3.5 h-3.5" /> Client
            </button>

            <button
              onClick={() => switchTo("pro")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                !isClient
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Pro
            </button>
          </div>
        )}

        {showLabels && (
          <div
            className={`mx-3 mb-2 px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase animate-fade-in whitespace-nowrap ${
              isClient ? "text-primary" : "text-emerald-600"
            }`}
          >
            {isClient ? "Espace client" : "Espace professionnel"}
          </div>
        )}

        <nav
          className={`flex-1 ${
            !showLabels ? "px-2" : "px-3"
          } space-y-1 overflow-y-auto`}
        >
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            const isMessages =
              item.to === "/messages" || item.to === "/pro/messages";
            const isInbox = item.to === "/pro/demandes";
            const showBadge = isMessages
              ? unread > 0
              : isInbox
                ? inboxCount > 0
                : false;
            const badgeCount = isMessages ? unread : isInbox ? inboxCount : 0;

            const linkElement = (
              <Link
                to={item.to}
                onClick={() => onNavigate?.()}
                className={`relative flex items-center ${
                  !showLabels
                    ? "justify-center px-0 py-2.5"
                    : "gap-3 px-3 py-2.5"
                } rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />

                {showLabels && (
                  <span className="flex-1 animate-fade-in whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {showLabels && item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gradient-primary text-primary-foreground animate-fade-in">
                    {item.badge}
                  </span>
                )}

                {showLabels && isMessages && unread > 0 && (
                  <span className="text-[11px] font-semibold w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-fade-in">
                    {unread}
                  </span>
                )}

                {showLabels && isInbox && inboxCount > 0 && (
                  <span className="text-[11px] font-semibold w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-fade-in">
                    {inboxCount}
                  </span>
                )}

                {!showLabels && showBadge && (
                  <span
                    className={`absolute top-1 right-1 text-[9px] font-semibold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white ${
                      isInbox ? "bg-emerald-500" : "bg-primary"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );

            if (!showLabels) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-1.5">
                    {item.label}
                    {item.badge && (
                      <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-gradient-primary text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.to}>{linkElement}</div>;
          })}
        </nav>

        {showLabels && (
          <div className="p-3 space-y-3 animate-fade-in">
            {isClient ? (
              <>
                <div className="rounded-2xl p-4 bg-gradient-soft border border-accent">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    Assistant Booker <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                    Retrouvez vos recherches, réservations et échanges au même endroit.
                  </p>
                </div>

                <div className="rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5">
                  <div className="text-sm font-semibold">Devenez pro</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Créez votre fiche professionnelle et renseignez vos disponibilités.
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
                  <MapPin className="w-4 h-4 text-emerald-600" /> Zone
                  d'intervention
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                  {zoneSummary} · {inboxCount} demande{inboxCount > 1 ? "s" : ""} en attente.
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
        )}
      </aside>
    </TooltipProvider>
  );
}
