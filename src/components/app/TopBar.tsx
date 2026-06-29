import { Bell, Search, MapPin, ChevronDown, Clock, Power, Inbox, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useBooker, getPro, type When } from "@/lib/booker-store";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { supabase } from "@/integrations/supabase/client";
import userMarion from "@/assets/user-marion.jpg";

const WHEN_OPTIONS: { label: string; value: When }[] = [
  { label: "Maintenant", value: { kind: "now" } },
  { label: "Aujourd'hui", value: { kind: "today" } },
];

export function TopBar() {
  const role = useBooker((s) => s.role);
  const proIdentityId = useBooker((s) => s.proIdentityId);
  const proVisible = useBooker((s) => s.proVisible);
  const setProVisible = useBooker((s) => s.setProVisible);
  const inboxCount = useBooker((s) => s.proInbox.filter((r) => r.status === "pending").length);

  const searchQuery = useBooker((s) => s.searchQuery);
  const setSearchQuery = useBooker((s) => s.setSearchQuery);
  const location = useBooker((s) => s.location);
  const setLocation = useBooker((s) => s.setLocation);
  const when = useBooker((s) => s.when);
  const setWhen = useBooker((s) => s.setWhen);
  const notifs = useBooker((s) => s.notifications);
  const markRead = useBooker((s) => s.markAllNotificationsRead);
  const [open, setOpen] = useState(false);
  const [editLoc, setEditLoc] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const unread = notifs.filter((n) => !n.read).length;

  const isClient = role === "client";
  const proIdentity = getPro(proIdentityId);

  const whenLabel =
    when.kind === "now" ? "Maintenant" : when.kind === "today" ? "Aujourd'hui" : when.iso;

  return (
    <header className={`h-20 px-8 flex items-center gap-3 border-b sticky top-0 z-30 ${
      isClient ? "bg-background border-border" : "bg-emerald-50/50 border-emerald-200/60"
    }`}>
      {isClient ? (
        <>
          <div className="flex-1 max-w-xl relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Brushing, massage, coach... que cherchez-vous ?"
              className="w-full h-12 pl-11 pr-4 rounded-full bg-secondary border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition"
            />
          </div>

          {editLoc ? (
            <input
              autoFocus
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => setEditLoc(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditLoc(false)}
              className="h-12 px-4 rounded-full border border-primary bg-card text-sm w-44 outline-none"
            />
          ) : (
            <button
              onClick={() => setEditLoc(true)}
              className="h-12 px-4 rounded-full border border-border bg-card flex items-center gap-2 text-sm font-medium hover:bg-secondary transition"
            >
              <MapPin className="w-4 h-4 text-primary" />
              {location}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setWhenOpen((o) => !o)}
              className="h-12 px-4 rounded-full border border-border bg-card flex items-center gap-2 text-sm font-medium hover:bg-secondary transition"
            >
              <Clock className="w-4 h-4 text-primary" />
              {whenLabel}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {whenOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-card overflow-hidden z-40">
                {WHEN_OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => { setWhen(o.value); setWhenOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary"
                  >
                    {o.label}
                  </button>
                ))}
                <div className="border-t border-border p-2">
                  <input
                    type="date"
                    onChange={(e) => { if (e.target.value) { setWhen({ kind: "date", iso: e.target.value }); setWhenOpen(false); } }}
                    className="w-full h-9 px-2 rounded-lg bg-secondary text-sm outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* PRO bar */}
          <div className="flex-1 flex items-center gap-3">
            <button
              onClick={() => setProVisible(!proVisible)}
              className={`h-12 px-4 rounded-full border flex items-center gap-2 text-sm font-semibold transition ${
                proVisible
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-glow"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              <Power className="w-4 h-4" />
              {proVisible ? "Disponible maintenant" : "Hors ligne"}
            </button>
            <div className="h-12 px-4 rounded-full border border-emerald-200 bg-white/70 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-muted-foreground">Zone :</span>
              <span className="font-medium">Paris 17e · 5 km</span>
            </div>
            <Link
              to="/pro/demandes"
              className="h-12 px-4 rounded-full border border-emerald-200 bg-white/70 flex items-center gap-2 text-sm hover:bg-white"
            >
              <Inbox className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{inboxCount}</span>
              <span className="text-muted-foreground">demandes</span>
            </Link>
          </div>
        </>
      )}

      <div className="relative">
        <button
          onClick={() => {
            setOpen((o) => !o);
            if (!open) markRead();
          }}
          className="relative w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center border-2 border-background">
              {unread}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-card overflow-hidden z-40">
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">
              Notifications
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifs.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-border last:border-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <UserMenu role={role} proIdentity={proIdentity} />
    </header>
  );
}

function UserMenu({ role, proIdentity }: { role: string; proIdentity: ReturnType<typeof getPro> }) {
  const { user, profile, role: authRole, pro, loading } = useCurrentUserProfile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isClient = role === "client";

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/auth", search: { redirect: "/" } });
  }

  if (loading) {
    return <div className="w-12 h-12 rounded-full bg-card border border-border animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        to="/auth"
        search={{ redirect: "/" }}
        className="flex items-center gap-2 px-4 h-12 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:opacity-90 transition"
      >
        <LogIn className="w-4 h-4" />
        Connexion
      </Link>
    );
  }

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "?";
  const firstName = displayName.split(" ")[0] || user.email?.split("@")[0] || "?";
  const initials = displayName.slice(0, 1).toUpperCase();
  const proName = pro?.name ?? proIdentity.name;
  const proCategory = pro?.category ?? proIdentity.category;
  const proAvatar = pro?.avatar_url ?? proIdentity.avatar;
  const avatarUrl = isClient ? profile?.avatar_url : proAvatar;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 pl-1 pr-3 h-12 rounded-full bg-card border ${
          isClient ? "border-border" : "border-emerald-500"
        } hover:bg-secondary transition`}
      >
        <img
          src={avatarUrl || userMarion}
          alt={isClient ? "" : proName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="text-left leading-tight">
          <div className="text-sm font-semibold">
            {firstName || initials}
          </div>
          <div className={`text-[10px] font-semibold ${isClient ? "text-primary" : "text-emerald-600"}`}>
            {authRole === "admin" ? "ADMIN" : isClient ? "CLIENTE" : `PRO · ${proCategory.toUpperCase()}`}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-card overflow-hidden z-40">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-semibold truncate">{user.email}</div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-secondary transition"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
