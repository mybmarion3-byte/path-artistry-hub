import { List as ListIcon, MapIcon, Search, Sparkles, Zap } from "lucide-react";
import type { MatchResult } from "@/lib/matching";
import { useLiveEta } from "@/components/app/booking-hooks";
import { MiniBtn } from "@/components/app/booking-ui";
import mapBg from "@/assets/map-paris.jpg";

export function MapView(props: {
  view: "map" | "list" | "ai";
  setView: (v: "map" | "list" | "ai") => void;
  results: MatchResult[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onOpenRequest: () => void;
  searchQuery: string;
  location: string;
}) {
  const { view, setView, results, selectedId, onSelect, location } = props;
  const liveEta = useLiveEta(location);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border shadow-soft bg-secondary">
      <img src={mapBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <button className="bg-card shadow-card border border-border px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
          <Search className="w-4 h-4" />
          {props.searchQuery ? `“${props.searchQuery}”` : "Recherche dans cette zone"}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-card shadow-card border border-border rounded-full p-1 flex gap-1">
        {([
          { v: "map" as const, icon: MapIcon, label: "Carte" },
          { v: "list" as const, icon: ListIcon, label: "Liste" },
          { v: "ai" as const, icon: Sparkles, label: "IA Match" },
        ]).map((x) => {
          const Icon = x.icon;
          const active = view === x.v;
          return (
            <button
              key={x.v}
              onClick={() => setView(x.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {x.label}
            </button>
          );
        })}
      </div>

      {view === "list" ? (
        <div className="relative z-10 p-6 grid grid-cols-2 gap-3 overflow-y-auto h-full pt-20">
          {results.map((r) => (
            <button
              key={r.pro.id}
              onClick={() => props.onOpenProfile(r.pro.id)}
              className="bg-card rounded-2xl p-4 border border-border text-left hover:border-primary transition flex gap-3 shadow-soft"
            >
              <img src={r.pro.avatar} className="w-14 h-14 rounded-full object-cover" alt="" loading="lazy" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.pro.name}</div>
                <div className="text-xs text-muted-foreground">{r.pro.job}</div>
                <div className="text-xs text-primary font-medium mt-1">dès {r.pro.price} €</div>
                <div className={`text-[11px] mt-1 ${r.statusTone === "now" ? "text-success" : "text-muted-foreground"}`}>
                  {r.statusLabel}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : view === "ai" ? (
        <div className="relative z-10 p-8 h-full flex items-center justify-center">
          <div className="bg-card/95 backdrop-blur rounded-3xl p-8 max-w-md border border-border shadow-card text-center">
            <Sparkles className="w-10 h-10 mx-auto text-primary" />
            <h3 className="text-xl font-semibold mt-3">IA Match</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Décrivez votre besoin, l'IA trouve le pro parfait pour vous.
            </p>
            <input
              placeholder="Ex: balayage blond cet après-midi"
              className="w-full mt-4 h-11 px-4 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary"
            />
            <button className="mt-3 w-full bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium shadow-glow">
              Trouver mon match
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute left-[55%] top-[58%] -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-32 h-32 rounded-full bg-primary/20 blur-sm" />
            <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-primary border-2 border-card" />
          </div>

          {results.map((r) => {
            const p = r.pro;
            const active = p.id === selectedId;
            const etaMin = liveEta(p);
            const isNow = r.statusTone === "now";
            return (
              <button
                key={p.id}
                onClick={() => { onSelect(p.id); }}
                onDoubleClick={() => props.onOpenProfile(p.id)}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                {active && (
                  <>
                    <span className="absolute inset-0 -m-4 rounded-full bg-emerald-400/30 blur-xl animate-pulse" />
                    <span className="absolute inset-0 -m-2 rounded-full ring-4 ring-emerald-400/40" />
                  </>
                )}
                <div className={`relative rounded-full p-0.5 transition ${
                  active ? "bg-emerald-500 scale-110 shadow-[0_0_24px_rgba(16,185,129,0.6)]" : "bg-card shadow-card group-hover:scale-105"
                }`}>
                  <img src={p.avatar} className={`rounded-full object-cover ${active ? "w-16 h-16" : "w-12 h-12"}`} alt="" loading="lazy" />
                </div>
                {active && isNow ? (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-white rounded-xl px-2.5 py-1 shadow-lg whitespace-nowrap text-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"><Zap className="w-3 h-3 fill-white" /> Disponible</div>
                    <div className="text-[10px] opacity-95">Chez vous dans {etaMin} min</div>
                  </div>
                ) : (
                  <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm ${
                    isNow ? "bg-emerald-500 text-white" : "bg-card text-foreground border border-border"
                  }`}>
                    {isNow ? `${etaMin} min` : p.availability}
                  </span>
                )}
              </button>
            );
          })}
        </>
      )}

      {/* Big instant-request CTA */}
      <button
        onClick={props.onOpenRequest}
        className="absolute left-4 bottom-6 z-10 bg-gradient-primary text-primary-foreground rounded-2xl shadow-glow px-5 py-3 flex items-center gap-2 hover:opacity-95 transition"
      >
        <Zap className="w-4 h-4" />
        <div className="text-left leading-tight">
          <div className="text-sm font-semibold">Envoyer une demande</div>
          <div className="text-[11px] opacity-90">Le premier pro dispo vous prend</div>
        </div>
      </button>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <MiniBtn label="Position">📍</MiniBtn>
        <MiniBtn label={`${5} km`}>⊙</MiniBtn>
      </div>
      <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-1 bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <button className="w-9 h-9 hover:bg-secondary text-lg">+</button>
        <button className="w-9 h-9 hover:bg-secondary text-lg border-t border-border">−</button>
      </div>
    </div>
  );
}
