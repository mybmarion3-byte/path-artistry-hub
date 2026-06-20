import { Bell, Search, MapPin, ChevronDown, Clock } from "lucide-react";
import { useState } from "react";
import { useBooker, type When } from "@/lib/booker-store";
import userMarion from "@/assets/user-marion.jpg";

const WHEN_OPTIONS: { label: string; value: When }[] = [
  { label: "Maintenant", value: { kind: "now" } },
  { label: "Aujourd'hui", value: { kind: "today" } },
];

export function TopBar() {
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

  const whenLabel =
    when.kind === "now" ? "Maintenant" : when.kind === "today" ? "Aujourd'hui" : when.iso;

  return (
    <header className="h-20 px-8 flex items-center gap-3 border-b border-border bg-background sticky top-0 z-30">
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

      <button className="flex items-center gap-2 pl-1 pr-3 h-12 rounded-full bg-card border border-border hover:bg-secondary transition">
        <img src={userMarion} alt="Marion" className="w-10 h-10 rounded-full object-cover" />
        <div className="text-left leading-tight">
          <div className="text-sm font-semibold">Marion</div>
          <div className="text-[10px] font-semibold text-primary">CLIENTE</div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
    </header>
  );
}
