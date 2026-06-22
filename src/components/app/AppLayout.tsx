import { useEffect, useState, type ReactNode } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useBooker } from "@/lib/booker-store";
import { useAuth } from "@/hooks/use-auth";

const CLIENT_ONLY = ["/", "/reservations", "/messages", "/favoris", "/paiements", "/avis", "/calendrier", "/analyses", "/parametres"];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = useBooker((s) => s.role);
  const setRole = useBooker((s) => s.setRole);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const isProPath = pathname === "/pro" || pathname.startsWith("/pro/");
    if (isProPath && !loading && !user) {
      navigate({ to: "/auth", search: { redirect: pathname } });
      return;
    }
    if (role === "client" && isProPath) {
      setRole("pro");
    } else if (role === "pro" && CLIENT_ONLY.includes(pathname)) {
      navigate({ to: "/pro" });
    }
  }, [pathname, role, setRole, navigate, user, loading]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Spacer to prevent layout shift during hover expand */}
      <div className={`${expanded ? "w-64" : "w-16"} shrink-0 transition-all duration-200 hidden md:block`} />
      <Sidebar collapsed={!expanded} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center sticky top-0 z-30">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Réduire le menu" : "Ouvrir le menu"}
            className="h-20 px-4 flex items-center justify-center bg-background border-b border-border hover:bg-secondary transition"
          >
            {expanded ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <TopBar />
          </div>
        </div>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
