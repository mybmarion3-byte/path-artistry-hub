import { ArrowUpDown, Clock, Filter, Heart, Star, Zap } from "lucide-react";
import { useBooker } from "@/lib/booker-store";
import type { MatchResult } from "@/lib/matching";
import { useLiveEta } from "@/components/app/booking-hooks";
import { Chip } from "@/components/app/booking-ui";

export function ProListColumn(props: {
  results: MatchResult[];
  selectedProId: string;
  favorites: string[];
  filters: { categories: string[]; atHome: boolean; maxKm: number };
  onSelect: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onFav: (id: string) => void;
  onRemoveCat: (c: string) => void;
  onClear: () => void;
  onOpenFilters: () => void;
}) {
  const { results, selectedProId, favorites, filters } = props;
  const location = useBooker((s) => s.location);
  const liveEta = useLiveEta(location);

  return (
    <div className="bg-card border border-border rounded-3xl p-5 flex flex-col min-h-0 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Pros autour de vous</h2>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {results.length} résultats correspondants
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={props.onOpenFilters}
          className="flex-1 h-10 rounded-xl border border-border bg-card flex items-center justify-center gap-2 text-sm font-medium hover:bg-secondary transition"
        >
          <Filter className="w-4 h-4" /> Filtres
          {(filters.categories.length + (filters.atHome ? 1 : 0)) > 0 && (
            <span className="ml-1 text-[10px] font-semibold w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              {filters.categories.length + (filters.atHome ? 1 : 0)}
            </span>
          )}
        </button>
        <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition">
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {filters.categories.map((c) => (
          <Chip key={c} onRemove={() => props.onRemoveCat(c)}>{c}</Chip>
        ))}
        {filters.atHome && <Chip onRemove={() => {}}>À domicile</Chip>}
        <Chip onRemove={() => {}}>Moins de {filters.maxKm} km</Chip>
        {(filters.categories.length || filters.atHome) ? (
          <button onClick={props.onClear} className="text-xs text-primary font-medium hover:underline px-1">
            Effacer tout
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto mt-4 -mx-2 px-2 space-y-2">
        {results.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Aucun pro ne correspond. Essayez d'élargir vos critères ou{" "}
            <button onClick={props.onClear} className="text-primary underline">réinitialisez</button>.
          </div>
        )}
        {results.map((r) => {
          const p = r.pro;
          const active = p.id === selectedProId;
          const fav = favorites.includes(p.id);
          const etaMin = liveEta(p);
          const isNow = r.statusTone === "now";
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => props.onSelect(p.id)}
              onDoubleClick={() => props.onOpenProfile(p.id)}
              onKeyDown={(e) => { if (e.key === "Enter") props.onSelect(p.id); }}
              className={`w-full text-left p-3 rounded-[20px] border transition relative group cursor-pointer bg-card ${
                active
                  ? "border-primary/40 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)] ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              {isNow && (
                <div className="mb-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                  <Zap className="w-3 h-3 fill-white" /> Disponible maintenant
                </div>
              )}
              <div className="flex gap-3">
                <div className="relative shrink-0">
                  <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                  {isNow && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); props.onFav(p.id); }}
                      className="shrink-0"
                      aria-label="Favori"
                    >
                      <Heart className={`w-4 h-4 ${fav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.job}</div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span className="font-medium">{p.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">• 📍 {p.distanceKm} km</span>
                    <span className="text-muted-foreground">• 💰 dès {p.price} €</span>
                  </div>
                </div>
              </div>
              <div className={`mt-2.5 flex items-center gap-1.5 text-sm font-semibold ${
                isNow ? "text-emerald-600" : r.statusTone === "soon" ? "text-primary" : "text-muted-foreground"
              }`}>
                {isNow ? (
                  <>
                    <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                    Arrive dans {etaMin} min
                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600/80">
                      <span className="relative flex w-1.5 h-1.5">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        <span className="relative rounded-full w-1.5 h-1.5 bg-emerald-500" />
                      </span>
                      Live
                    </span>
                  </>
                ) : (
                  <><Clock className="w-3.5 h-3.5" /> {r.statusLabel}</>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
