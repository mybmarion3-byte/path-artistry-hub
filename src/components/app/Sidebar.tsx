import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import { useBooker } from "@/lib/booker-store";

const nav = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/reservations", label: "Réservations", icon: CalendarCheck },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/favoris", label: "Favoris", icon: Heart },
  { to: "/paiements", label: "Paiements", icon: CreditCard },
  { to: "/avis", label: "Avis", icon: Star },
  { to: "/calendrier", label: "Calendrier", icon: Calendar },
  { to: "/analyses", label: "Analyses", icon: BarChart3, badge: "NOUVEAU" },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = useBooker((s) => s.messages.filter((m) => m.from === "pro").length);

  return (
    <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-glow">
          B
        </div>
        <div className="font-semibold text-lg">
          Booker <span className="text-muted-foreground font-normal">2030</span>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          const isMessages = item.to === "/messages";
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
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-3">
        <div className="rounded-2xl p-4 bg-gradient-soft border border-accent">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            Booker AI <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
            Votre assistant personnel. Je peux vous aider à trouver le pro parfait selon vos
            besoins.
          </p>
          <button className="mt-3 w-full bg-gradient-primary text-primary-foreground text-sm font-medium rounded-lg py-2 hover:opacity-90 transition shadow-glow">
            Discuter avec l'IA
          </button>
        </div>

        <div className="rounded-2xl p-4 border border-success/30 bg-success/5">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            Devenez pro <Sparkles className="w-4 h-4 text-success" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Augmentez vos réservations de 300%
          </p>
          <button className="mt-3 w-full border border-success/40 text-success text-sm font-medium rounded-lg py-2 hover:bg-success/10 transition flex items-center justify-center gap-1">
            Commencer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
