import { useEffect, type ReactNode } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useBooker } from "@/lib/booker-store";

// Paths that only make sense for one role. Visiting them while in the
// wrong role auto-switches the user back to the right space.
const CLIENT_ONLY = ["/", "/reservations", "/messages", "/favoris", "/paiements", "/avis", "/calendrier", "/analyses", "/parametres"];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = useBooker((s) => s.role);
  const setRole = useBooker((s) => s.setRole);
  const navigate = useNavigate();

  useEffect(() => {
    const isProPath = pathname === "/pro" || pathname.startsWith("/pro/");
    if (role === "client" && isProPath) {
      // entering pro space → switch identity
      setRole("pro");
    } else if (role === "pro" && CLIENT_ONLY.includes(pathname)) {
      // pro landed on a client-only page → redirect to pro dashboard
      navigate({ to: "/pro" });
    }
  }, [pathname, role, setRole, navigate]);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
