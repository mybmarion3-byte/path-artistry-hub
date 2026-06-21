import { useEffect, useState, type ReactNode } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useBooker } from "@/lib/booker-store";

const CLIENT_ONLY = ["/", "/reservations", "/messages", "/favoris", "/paiements", "/avis", "/calendrier", "/analyses", "/parametres"];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = useBooker((s) => s.role);
  const setRole = useBooker((s) => s.setRole);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const isProPath = pathname === "/pro" || pathname.startsWith("/pro/");
    if (role === "client" && isProPath) {
      setRole("pro");
    } else if (role === "pro" && CLIENT_ONLY.includes(pathname)) {
      navigate({ to: "/pro" });
    }
  }, [pathname, role, setRole, navigate]);

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="h-20 px-4 flex items-center justify-center bg-background border-b border-border hover:bg-secondary transition"
          >
            <Menu className="w-5 h-5" />
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
