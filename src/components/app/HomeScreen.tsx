import { useMemo, useState, useEffect } from "react";
import {
  Star, Heart, Search, Filter, ArrowUpDown, MapIcon, List as ListIcon,
  Sparkles, Home as HomeIcon, ShieldCheck, CreditCard, MessageCircle,
  CheckCircle2, X, Send, Clock, Zap, Video, Building2, ArrowRight, Loader2, Check,
  MapPin, Phone, Lock, MessageSquare, Plus, Hotel, Briefcase, Users,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PROS, getPro, useBooker, CATEGORIES, BUSINESSES, DEFAULT_ADDRESSES, getBusinessesForPro, getProsForBusiness, type Pro, type Mode, type Service, type BusinessLocation, type ClientAddress } from "@/lib/booker-store";
import { matchPros, findEligibleProsForRequest, type MatchResult } from "@/lib/matching";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import mapBg from "@/assets/map-paris.jpg";

function hashLocation(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Real-time ETA: recomputes every 30 s and whenever the user's location changes.
 * Returns the estimated arrival time in minutes for any pro.
 */
function useLiveEta(location: string) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const offsetKm = useMemo(() => {
    const h = hashLocation(location || "");
    // Deterministic offset per location, range ~[-1.0, +2.6] km
    return ((h % 36) / 10) - 1.0;
  }, [location]);
  return useMemo(() => {
    const minute = new Date().getMinutes();
    const jitter = ((minute % 5) - 2); // small live variation ±2 min
    return (pro: { distanceKm: number }) => {
      const adj = Math.max(0.2, pro.distanceKm + offsetKm);
      return Math.max(5, Math.round(adj * 6 + 6 + jitter));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offsetKm, tick]);
}

export function HomeScreen() {
  const {
    selectedProId, favorites, filters, view,
    searchQuery, when, location,
    selectPro, toggleFavorite, setView,
    removeFilterCategory, clearFilters, toggleFilterCategory, setFilters,
  } = useBooker();

  const results = useMemo(
    () =>
      matchPros({
        query: searchQuery,
        category: filters.categories[0],
        when,
        maxKm: filters.maxKm,
        atHome: filters.atHome,
      }),
    [searchQuery, when, filters],
  );

  const selectedResult =
    results.find((r) => r.pro.id === selectedProId) ?? results[0] ?? null;

  const [profileOpen, setProfileOpen] = useState(false);
  const [bookingFor, setBookingFor] = useState<{ pro: Pro; service?: Service; slotIso?: string } | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function openProfile(id: string) {
    selectPro(id);
    setProfileOpen(true);
  }

  return (
    <div className="grid grid-cols-[340px_1fr_420px] gap-5 p-5 h-[calc(100vh-5rem)]">
      <ProListColumn
        results={results}
        selectedProId={selectedProId}
        favorites={favorites}
        filters={filters}
        onSelect={selectPro}
        onOpenProfile={openProfile}
        onFav={toggleFavorite}
        onRemoveCat={removeFilterCategory}
        onClear={clearFilters}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <MapView
        view={view}
        setView={setView}
        results={results}
        selectedId={selectedProId}
        onSelect={selectPro}
        onOpenProfile={openProfile}
        onOpenRequest={() => setRequestOpen(true)}
        searchQuery={searchQuery}
        location={location}
      />

      <BookingPanel
        result={selectedResult}
        onOpenProfile={() => selectedResult && openProfile(selectedResult.pro.id)}
        onBook={(slotIso) => selectedResult && setBookingFor({ pro: selectedResult.pro, slotIso })}
        onOpenRequest={() => setRequestOpen(true)}
      />

      {/* AI floating button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center text-primary-foreground hover:scale-105 transition z-30"
        aria-label="Booker AI"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <ProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        result={selectedResult}
        favorites={favorites}
        onFav={toggleFavorite}
        onBook={(service, slotIso) =>
          selectedResult && setBookingFor({ pro: selectedResult.pro, service, slotIso })
        }
      />

      <BookingDialog
        state={bookingFor}
        onClose={() => setBookingFor(null)}
      />

      <InstantRequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        defaultLocation={location}
        defaultCategory={filters.categories[0]}
      />

      <FiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onToggle={toggleFilterCategory}
        onSetFilters={setFilters}
      />

      {aiOpen && (
        <AIAssistant
          onClose={() => setAiOpen(false)}
          onPick={(id) => { setAiOpen(false); openProfile(id); }}
        />
      )}
    </div>
  );
}

/* -------------------- Pro list -------------------- */

function ProListColumn(props: {
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

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary px-2.5 py-1 rounded-full">
      {children}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/* -------------------- Map -------------------- */

function MapView(props: {
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

function MiniBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button className="w-12 h-12 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-xs text-muted-foreground shadow-soft hover:bg-secondary transition">
      <span className="text-base">{children}</span>
      <span className="text-[9px] leading-tight mt-0.5">{label}</span>
    </button>
  );
}

/* -------------------- Booking panel (right) -------------------- */

function BookingPanel(props: {
  result: MatchResult | null;
  onOpenProfile: () => void;
  onBook: (slotIso: string) => void;
  onOpenRequest: () => void;
}) {
  const { result } = props;
  const location = useBooker((s) => s.location);
  const liveEta = useLiveEta(location);

  if (!result) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-soft">
        <Search className="w-10 h-10 text-muted-foreground" />
        <h3 className="font-semibold mt-3">Aucun pro sélectionné</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustez vos critères ou envoyez une demande directe.
        </p>
        <button
          onClick={props.onOpenRequest}
          className="mt-4 bg-gradient-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium shadow-glow flex items-center gap-2"
        >
          <Zap className="w-4 h-4" /> Demande instantanée
        </button>
      </div>
    );
  }

  const pro = result.pro;
  const etaMin = liveEta(pro);
  const isNow = result.statusTone === "now";
  const firstSlotLabel = result.nextSlots.find((s) => s.label !== "Maintenant")?.label ?? result.nextSlots[0]?.label ?? "—";
  return (
    <div className="bg-card border border-border rounded-[24px] p-5 flex flex-col min-h-0 shadow-soft overflow-y-auto">
      <div className="flex gap-3">
        <img src={pro.avatar} className="w-16 h-16 rounded-full object-cover" alt={pro.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold">{pro.name}</h3>
            {pro.verified && <ShieldCheck className="w-4 h-4 text-primary" />}
          </div>
          <div className="text-sm text-muted-foreground">{pro.job}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="font-medium">{pro.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({pro.reviews} avis)</span>
            <span className="text-muted-foreground">• {pro.distanceKm} km</span>
          </div>
        </div>
      </div>

      {isNow ? (
        <div className="mt-4 rounded-[20px] bg-emerald-50 border border-emerald-200/70 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative rounded-full w-2.5 h-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold">Chez vous dans {etaMin} min</span>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">Live</span>
          </div>
          <div className="text-xs text-emerald-700/80 mt-1">Premier créneau : {firstSlotLabel} · depuis {location || "votre position"}</div>
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] bg-accent/40 border border-border p-4 flex items-center gap-2 text-sm text-foreground">
          <Clock className="w-4 h-4 text-primary" /> {result.statusLabel}
        </div>
      )}

      <div className="mt-5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mode de prestation</div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { m: "home" as const, label: "À domicile", icon: HomeIcon, emoji: "🏠" },
            { m: "studio" as const, label: "Établissement", icon: Building2, emoji: "🏢" },
            { m: "video" as const, label: "Visio", icon: Video, emoji: "💻" },
          ]).map((opt) => {
            const enabled = pro.modes.includes(opt.m);
            return (
              <button
                key={opt.m}
                disabled={!enabled}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-[11px] font-medium transition ${
                  enabled
                    ? "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                    : "border-border/50 bg-secondary/40 text-muted-foreground/60 cursor-not-allowed"
                }`}
              >
                <span className="text-base leading-none">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold">{pro.specialty}</div>
        <p className="text-muted-foreground text-xs mt-1 leading-relaxed line-clamp-2">{pro.bio}</p>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Disponibilités</div>
        <div className="grid grid-cols-3 gap-2">
          {result.nextSlots.slice(0, 6).map((s) => {
            const slotIsNow = s.label === "Maintenant";
            return (
              <button
                key={s.iso}
                onClick={() => props.onBook(s.iso)}
                className={`py-2.5 rounded-2xl text-xs font-semibold border transition ${
                  slotIsNow
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:bg-emerald-600"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                }`}
              >
                {slotIsNow ? <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3 fill-white" />Maintenant</span> : s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-5 space-y-2">
        <button
          onClick={() => props.onBook(result.nextSlots[0]?.iso ?? "")}
          className={`w-full font-semibold rounded-2xl py-3.5 transition ${
            isNow
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.55)]"
              : "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-base">
            {isNow && <Zap className="w-4 h-4 fill-white" />}
            {isNow ? "Réserver maintenant" : `Réserver dès ${pro.price} €`}
          </div>
          {isNow && <div className="text-[11px] font-normal opacity-90 mt-0.5">Disponible dans {etaMin} min</div>}
        </button>
        <button
          onClick={props.onOpenProfile}
          className="w-full border border-border rounded-2xl py-2.5 text-sm font-medium hover:bg-secondary transition"
        >
          Voir le profil complet
        </button>
      </div>
    </div>
  );
}

/* -------------------- Profile Sheet -------------------- */

function ProfileSheet(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  result: MatchResult | null;
  favorites: string[];
  onFav: (id: string) => void;
  onBook: (service: Service, slotIso: string) => void;
}) {
  const { result } = props;
  const navigate = useNavigate();
  const sendMessage = useBooker((s) => s.sendMessage);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("home");

  useEffect(() => {
    if (result) {
      setServiceId(result.pro.services[0]?.id ?? null);
      setSlotIso(result.nextSlots[0]?.iso ?? null);
      setMode(result.pro.modes[0]);
    }
  }, [result?.pro.id]);

  if (!result) return null;
  const pro = result.pro;
  const service = pro.services.find((s) => s.id === serviceId) ?? pro.services[0];
  const fav = props.favorites.includes(pro.id);

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="relative h-40 bg-gradient-primary">
          <div className="absolute -bottom-12 left-6">
            <img src={pro.avatar} alt={pro.name} className="w-24 h-24 rounded-full border-4 border-card object-cover shadow-card" />
          </div>
          <button
            onClick={() => props.onFav(pro.id)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center hover:bg-card"
            aria-label="Favori"
          >
            <Heart className={`w-5 h-5 ${fav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
        </div>

        <div className="pt-14 px-6 pb-6">
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="flex items-center gap-2 text-2xl">
              {pro.name}
              {pro.verified && <ShieldCheck className="w-5 h-5 text-primary" />}
            </SheetTitle>
            <div className="text-muted-foreground">{pro.job}</div>
          </SheetHeader>

          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-warning text-warning" />{pro.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({pro.reviews} avis)</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{pro.distanceKm} km</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{pro.experience} ans d'exp.</span>
          </div>

          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            result.statusTone === "now" ? "bg-success/10 text-success" : "bg-accent text-accent-foreground"
          }`}>
            <Clock className="w-4 h-4" /> {result.statusLabel}
          </div>

          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{pro.bio}</p>

          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">Mode de prestation</div>
            <div className="flex gap-2">
              {pro.modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-1.5 ${
                    mode === m ? "border-primary bg-accent" : "border-border hover:bg-secondary"
                  }`}
                >
                  {m === "home" && <><HomeIcon className="w-4 h-4" /> À domicile</>}
                  {m === "studio" && <><Building2 className="w-4 h-4" /> Studio</>}
                  {m === "video" && <><Video className="w-4 h-4" /> Visio</>}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">Choisir une prestation</div>
            <div className="space-y-2">
              {pro.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    serviceId === s.id ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.duration} min</div>
                  </div>
                  <div className="font-semibold">{s.price} €</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">Prochaines disponibilités</div>
            <div className="grid grid-cols-3 gap-2">
              {result.nextSlots.map((s) => (
                <button
                  key={s.iso}
                  onClick={() => setSlotIso(s.iso)}
                  className={`py-2 rounded-xl text-xs font-medium border ${
                    slotIso === s.iso ? "border-primary bg-accent text-primary" : "border-border hover:bg-secondary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_auto] gap-2 sticky bottom-0 bg-card pt-3">
            <button
              onClick={() => service && slotIso && props.onBook(service, slotIso)}
              disabled={!service || !slotIso}
              className="bg-gradient-primary text-primary-foreground font-semibold rounded-2xl py-3 shadow-glow disabled:opacity-50"
            >
              Réserver — {service?.price ?? pro.price} €
            </button>
            <button
              onClick={() => {
                sendMessage(pro.id, "Bonjour, je souhaiterais en savoir plus sur vos prestations.");
                toast.success(`Message envoyé à ${pro.name.split(" ")[0]}`);
                navigate({ to: "/messages" });
              }}
              className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center hover:bg-secondary"
              aria-label="Message"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------- Booking Dialog (3 steps) -------------------- */

/* -------------------- Booking dialog (adaptive multi-step) -------------------- */

// Profil du compte client (pré-rempli à l'inscription)
// Laisser un champ vide pour simuler une info manquante — le tunnel basculera dessus automatiquement.
const ACCOUNT_PROFILE = {
  firstName: "Marion",
  phone: "06 24 18 92 07",
  digicode: "", // ← vide : le tunnel ouvrira l'étape Infos sur ce champ
};

const ACCOUNT_MAIN_ADDRESS = DEFAULT_ADDRESSES.find((a) => a.kind === "home");
const HAS_MAIN_ADDRESS = !!ACCOUNT_MAIN_ADDRESS;
const HAS_DIGICODE = ACCOUNT_PROFILE.digicode.trim().length > 0;

type StepKey = "service" | "mode" | "address" | "business" | "collaborator" | "slot" | "info" | "pay";

function buildSteps(mode: Mode): StepKey[] {
  if (mode === "home") return ["service", "mode", "address", "slot", "info", "pay"];
  if (mode === "studio") return ["service", "mode", "business", "collaborator", "slot", "info", "pay"];
  return ["service", "mode", "slot", "info", "pay"]; // video
}

function modeLabel(m: Mode) {
  return m === "home" ? "À domicile" : m === "studio" ? "En établissement" : "En visio";
}

function BookingDialog({
  state,
  onClose,
}: {
  state: { pro: Pro; service?: Service; slotIso?: string } | null;
  onClose: () => void;
}) {
  const addBooking = useBooker((s) => s.addBooking);
  const navigate = useNavigate();
  const pushNotification = useBooker((s) => s.pushNotification);

  const [stepIdx, setStepIdx] = useState(0);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);
  const [slotIso, setSlotIso] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<Mode>("home");
  const [addressId, setAddressId] = useState<string | undefined>("a1");
  const [customAddress, setCustomAddress] = useState("");
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);
  const [collaboratorId, setCollaboratorId] = useState<string | "any">("any");
  const [phone, setPhone] = useState("");
  const [digicode, setDigicode] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (state) {
      setStepIdx(0);
      setServiceId(state.service?.id ?? state.pro.services[0].id);
      setSlotIso(state.slotIso);
      const defaultMode: Mode = state.pro.modes.includes("home")
        ? "home"
        : state.pro.modes[0];
      setMode(defaultMode);
      setAddressId("a1");
      setCustomAddress("");
      const bizForPro = getBusinessesForPro(state.pro.id);
      setBusinessId(bizForPro[0]?.id);
      setCollaboratorId("any");
      // Pré-rempli depuis le compte client
      setPhone(ACCOUNT_PROFILE.phone);
      setDigicode(ACCOUNT_PROFILE.digicode);
      setComments("");
    }
  }, [state?.pro.id, state?.service?.id, state?.slotIso]);

  const sourcePro = state?.pro;
  const proForSlots = useMemo(() => {
    if (mode === "studio" && businessId && collaboratorId !== "any") {
      return getPro(collaboratorId);
    }
    return sourcePro ?? PROS[0];
  }, [mode, businessId, collaboratorId, sourcePro]);
  const slots = useBookerSlots(proForSlots.id);

  const steps = useMemo(() => buildSteps(mode), [mode]);
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  if (!state || !sourcePro) return null;
  const pro = sourcePro;
  const service = pro.services.find((s) => s.id === serviceId) ?? pro.services[0];
  const slot = slots.find((s) => s.iso === slotIso) ?? slots[0];

  const selectedBusiness: BusinessLocation | undefined =
    businessId ? BUSINESSES.find((b) => b.id === businessId) : undefined;
  const selectedAddress: ClientAddress | undefined =
    addressId ? DEFAULT_ADDRESSES.find((a) => a.id === addressId) : undefined;
  const finalAddress =
    mode === "home"
      ? (addressId === "custom" ? customAddress : selectedAddress?.address) ?? ""
      : "";

  const collaboratorPro =
    mode === "studio" && collaboratorId !== "any"
      ? getPro(collaboratorId)
      : undefined;

  const distanceKm =
    mode === "home"
      ? Math.max(0.4, pro.distanceKm + (addressId === "a2" ? 1.8 : addressId === "a3" ? 4.2 : 0))
      : selectedBusiness?.distanceKm ?? 0;
  const etaMin = Math.max(5, Math.round(distanceKm * 6 + 6));

  const serviceFee = Math.round(service.price * 0.05);
  const total = service.price + serviceFee;

  // Validation per step
  const canContinue = (() => {
    switch (currentStep) {
      case "service": return !!serviceId;
      case "mode": return !!mode && pro.modes.includes(mode === "studio" ? "studio" : mode === "video" ? "video" : "home");
      case "address": return mode !== "home" || (addressId === "custom" ? customAddress.trim().length > 3 : !!addressId);
      case "business": return !!businessId;
      case "collaborator": return !!collaboratorId;
      case "slot": return !!slotIso;
      case "info": return phone.trim().length >= 6;
      default: return true;
    }
  })();

  function confirm() {
    const bookedPro = collaboratorPro ?? pro;
    addBooking({
      proId: bookedPro.id,
      serviceId: service.id,
      serviceName: service.name,
      mode,
      date: slot?.iso.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      time: slot?.label ?? "—",
      price: total,
      address: mode === "home" ? finalAddress : selectedBusiness?.address,
      businessName: mode === "studio" ? selectedBusiness?.name : undefined,
      collaboratorName: mode === "studio" ? bookedPro.name : undefined,
      phone,
      digicode: mode === "home" ? digicode : undefined,
      comments,
    });
    pushNotification({
      title: `Réservation confirmée avec ${bookedPro.name.split(" ")[0]}`,
      body: `${service.name} — ${slot?.label}${mode === "studio" && selectedBusiness ? ` · ${selectedBusiness.name}` : ""}`,
    });
    toast.success("Réservation confirmée !", {
      description: `${bookedPro.name.split(" ")[0]} — ${service.name} · ${slot?.label}`,
    });
    onClose();
    navigate({ to: "/reservations" });
  }

  const businessesForPro = getBusinessesForPro(pro.id);
  const collaboratorsForBusiness = businessId ? getProsForBusiness(businessId) : [];

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-soft px-6 py-5 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img src={pro.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div>
                <div>Réserver avec {pro.name.split(" ")[0]}</div>
                <div className="text-xs font-normal text-muted-foreground">{pro.job}</div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Tunnel de réservation adaptatif — étape {stepIdx + 1} sur {steps.length}
            </DialogDescription>
          </DialogHeader>
          <Stepper step={stepIdx + 1} total={steps.length} />
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentStep === "service" && (
            <StepService
              services={pro.services}
              serviceId={serviceId}
              onSelect={setServiceId}
            />
          )}

          {currentStep === "mode" && (
            <StepMode
              available={pro.modes}
              mode={mode}
              hasEstablishment={businessesForPro.length > 0}
              onPick={setMode}
            />
          )}

          {currentStep === "address" && (
            <StepAddress
              addresses={DEFAULT_ADDRESSES}
              addressId={addressId}
              customAddress={customAddress}
              onSelect={setAddressId}
              onCustomChange={setCustomAddress}
              distanceKm={distanceKm}
              etaMin={etaMin}
            />
          )}

          {currentStep === "business" && (
            <StepBusiness
              list={businessesForPro.length > 0 ? businessesForPro : BUSINESSES}
              selectedId={businessId}
              onSelect={(id) => {
                setBusinessId(id);
                setCollaboratorId("any");
              }}
            />
          )}

          {currentStep === "collaborator" && (
            <StepCollaborator
              pros={collaboratorsForBusiness}
              selectedId={collaboratorId}
              onSelect={setCollaboratorId}
            />
          )}

          {currentStep === "slot" && (
            <StepSlot
              slots={slots}
              slotIso={slotIso}
              onSelect={setSlotIso}
              hint={
                mode === "studio" && selectedBusiness
                  ? `Agenda de ${selectedBusiness.name}`
                  : mode === "video"
                  ? "Créneaux visio disponibles"
                  : "Prochains créneaux du pro"
              }
            />
          )}

          {currentStep === "info" && (
            <StepInfo
              mode={mode}
              phone={phone}
              digicode={digicode}
              comments={comments}
              onPhone={setPhone}
              onDigicode={setDigicode}
              onComments={setComments}
            />
          )}

          {currentStep === "pay" && (
            <StepPay
              mode={mode}
              pro={collaboratorPro ?? pro}
              service={service}
              slotLabel={slot?.label ?? "—"}
              address={mode === "home" ? finalAddress : undefined}
              business={mode === "studio" ? selectedBusiness : undefined}
              etaMin={mode === "home" ? etaMin : undefined}
              serviceFee={serviceFee}
              total={total}
            />
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-between gap-2">
          {stepIdx > 0 ? (
            <button
              onClick={() => setStepIdx(stepIdx - 1)}
              className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary"
            >
              Retour
            </button>
          ) : <span />}
          {!isLast ? (
            <button
              onClick={() => setStepIdx(stepIdx + 1)}
              disabled={!canContinue}
              className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={confirm}
              className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Payer {total} €
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Step components -------------------- */

function StepService({
  services, serviceId, onSelect,
}: { services: Service[]; serviceId?: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Choisir la prestation</div>
      <div className="space-y-2">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex justify-between items-center p-3 rounded-2xl border text-left transition ${
              serviceId === s.id ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
            }`}
          >
            <div>
              <div className="font-medium text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.duration} min</div>
            </div>
            <div className="font-semibold">{s.price} €</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepMode({
  available, mode, hasEstablishment, onPick,
}: { available: Mode[]; mode: Mode; hasEstablishment: boolean; onPick: (m: Mode) => void }) {
  const options: { m: Mode; emoji: string; label: string; sub: string }[] = [
    { m: "home", emoji: "🏠", label: "À domicile", sub: "Le pro vient chez vous" },
    { m: "studio", emoji: "🏢", label: "En établissement", sub: "Vous vous déplacez" },
    { m: "video", emoji: "💻", label: "En visio", sub: "Sans déplacement" },
  ];
  return (
    <div>
      <div className="text-sm font-semibold mb-1">Comment souhaitez-vous être reçu&nbsp;?</div>
      <div className="text-xs text-muted-foreground mb-3">Une question, un parcours sur mesure.</div>
      <div className="space-y-2">
        {options.map((o) => {
          const enabled =
            o.m === "studio" ? hasEstablishment : available.includes(o.m);
          const active = mode === o.m;
          return (
            <button
              key={o.m}
              disabled={!enabled}
              onClick={() => onPick(o.m)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition ${
                active
                  ? "border-primary bg-accent/40 shadow-soft"
                  : enabled
                  ? "border-border hover:border-primary/40 hover:bg-secondary"
                  : "border-border/50 bg-secondary/40 text-muted-foreground/60 cursor-not-allowed"
              }`}
            >
              <span className="text-2xl leading-none">{o.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.sub}</div>
              </div>
              {active && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepAddress({
  addresses, addressId, customAddress, onSelect, onCustomChange, distanceKm, etaMin,
}: {
  addresses: ClientAddress[];
  addressId?: string;
  customAddress: string;
  onSelect: (id: string) => void;
  onCustomChange: (v: string) => void;
  distanceKm: number;
  etaMin: number;
}) {
  const iconFor = (k: ClientAddress["kind"]) =>
    k === "home" ? HomeIcon : k === "hotel" ? Hotel : k === "office" ? Briefcase : MapPin;
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Où le pro doit-il venir&nbsp;?</div>
      <div className="space-y-2">
        {addresses.map((a) => {
          const Icon = iconFor(a.kind);
          const active = addressId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
                active ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="text-xs text-muted-foreground truncate">{a.address}</div>
              </div>
              {active && <Check className="w-4 h-4 text-primary mt-1" />}
            </button>
          );
        })}
        <button
          onClick={() => onSelect("custom")}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
            addressId === "custom" ? "border-primary bg-accent/40" : "border-dashed border-border hover:bg-secondary"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">Ajouter une nouvelle adresse</span>
        </button>
        {addressId === "custom" && (
          <input
            value={customAddress}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Ex : 5 rue de la Paix, 75002 Paris"
            className="w-full h-11 px-4 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary"
          />
        )}
      </div>

      {(addressId && (addressId !== "custom" || customAddress.length > 3)) && (
        <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 p-3 text-xs text-emerald-700 flex items-center gap-4">
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {distanceKm.toFixed(1)} km</div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> ~{etaMin} min</div>
          <div className="flex items-center gap-1.5 ml-auto"><ShieldCheck className="w-3.5 h-3.5" /> Zone couverte</div>
        </div>
      )}
    </div>
  );
}

function StepBusiness({
  list, selectedId, onSelect,
}: { list: BusinessLocation[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Choisir l'établissement</div>
      <div className="space-y-2">
        {list.map((b) => {
          const active = selectedId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                active ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${b.gradient} flex items-center justify-center text-2xl shrink-0`}>
                {b.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{b.name}</div>
                <div className="text-xs text-muted-foreground truncate">{b.address}</div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.distanceKm} km</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Clock className="w-3 h-3" /> {b.nextSlot}
                  </span>
                </div>
              </div>
              {active && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepCollaborator({
  pros, selectedId, onSelect,
}: { pros: Pro[]; selectedId: string | "any"; onSelect: (id: string | "any") => void }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Choisir un collaborateur</div>
      <button
        onClick={() => onSelect("any")}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left mb-2 transition ${
          selectedId === "any" ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Peu importe</div>
          <div className="text-xs text-muted-foreground">Premier disponible · gain de temps</div>
        </div>
        {selectedId === "any" && <Check className="w-4 h-4 text-primary" />}
      </button>
      <div className="space-y-2">
        {pros.map((p) => {
          const active = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                active ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
              }`}
            >
              <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground truncate">{p.specialty}</div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px]">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" /> {p.rating.toFixed(1)}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {p.availability === "now" ? "Maintenant" : p.availability}
                  </span>
                </div>
              </div>
              {active && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepSlot({
  slots, slotIso, onSelect, hint,
}: { slots: { iso: string; label: string }[]; slotIso?: string; onSelect: (iso: string) => void; hint: string }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-1">Choisir un créneau</div>
      <div className="text-xs text-muted-foreground mb-3">{hint}</div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((s) => {
          const active = slotIso === s.iso;
          const now = s.label === "Maintenant";
          return (
            <button
              key={s.iso}
              onClick={() => onSelect(s.iso)}
              className={`py-2.5 rounded-2xl text-xs font-semibold border transition ${
                active
                  ? now
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                    : "border-primary bg-accent text-primary"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {now ? <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3 fill-current" />Maintenant</span> : s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepInfo({
  mode, phone, digicode, comments, onPhone, onDigicode, onComments,
}: {
  mode: Mode; phone: string; digicode: string; comments: string;
  onPhone: (v: string) => void; onDigicode: (v: string) => void; onComments: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Informations complémentaires</div>
        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1">
          <Check className="w-3 h-3" /> Pré-rempli depuis votre compte
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Bonjour {ACCOUNT_PROFILE.firstName}, vérifiez ou modifiez si besoin.
      </p>
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
          <Phone className="w-3.5 h-3.5" /> Téléphone
        </span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          placeholder="06 12 34 56 78"
          className="w-full h-11 px-4 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary"
        />
      </label>
      {mode === "home" && (
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5" /> Digicode (optionnel)
          </span>
          <input
            value={digicode}
            onChange={(e) => onDigicode(e.target.value)}
            placeholder="Ex : 1234A · 3e étage gauche"
            className="w-full h-11 px-4 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary"
          />
        </label>
      )}
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
          <MessageSquare className="w-3.5 h-3.5" /> Commentaires (optionnel)
        </span>
        <textarea
          value={comments}
          onChange={(e) => onComments(e.target.value)}
          rows={3}
          placeholder="Précisions pour le professionnel…"
          className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary resize-none"
        />
      </label>
    </div>
  );
}

function StepPay({
  mode, pro, service, slotLabel, address, business, etaMin, serviceFee, total,
}: {
  mode: Mode; pro: Pro; service: Service; slotLabel: string;
  address?: string; business?: BusinessLocation; etaMin?: number;
  serviceFee: number; total: number;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-3">Récapitulatif & paiement</div>
      <div className="rounded-2xl border border-border divide-y divide-border text-sm overflow-hidden">
        {mode === "studio" && business && <Row label="Établissement" value={business.name} />}
        {mode === "studio" && <Row label="Collaborateur" value={pro.name} />}
        {mode !== "studio" && <Row label="Professionnel" value={pro.name} />}
        <Row label="Prestation" value={`${service.name} (${service.duration} min)`} />
        {mode === "home" && address && <Row label="Adresse" value={address} />}
        <Row label="Créneau" value={slotLabel} />
        {mode === "home" && etaMin !== undefined && <Row label="Temps d'arrivée" value={`~${etaMin} min`} />}
        <Row label="Mode" value={modeLabel(mode)} />
        <Row label="Prix prestation" value={`${service.price} €`} />
        <Row label="Frais de service" value={`${serviceFee} €`} />
        <Row label="Total" value={`${total} €`} bold />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="w-3.5 h-3.5" />
        Paiement sécurisé · Annulation gratuite jusqu'à 4 h avant.
      </div>
    </div>
  );
}



function useBookerSlots(proId: string) {
  return useMemo(() => {
    const pro = getPro(proId);
    return matchPros({ query: "", when: { kind: "now" }, maxKm: 99, atHome: false })
      .find((r) => r.pro.id === pro.id)?.nextSlots ?? [];
  }, [proId]);
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between px-4 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold text-base" : "font-medium"}>{value}</span>
    </div>
  );
}

function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
              done ? "bg-success text-success-foreground" :
              active ? "bg-primary text-primary-foreground" :
              "bg-secondary text-muted-foreground"
            }`}>
              {done ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            {n < total && <div className={`flex-1 h-0.5 ${n < step ? "bg-success" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Instant Request Dialog -------------------- */

function InstantRequestDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultLocation: string;
  defaultCategory?: string;
}) {
  const createRequest = useBooker((s) => s.createRequest);
  const matchRequest = useBooker((s) => s.matchRequest);
  const addBooking = useBooker((s) => s.addBooking);
  const pushNotification = useBooker((s) => s.pushNotification);
  const navigate = useNavigate();

  const [category, setCategory] = useState(props.defaultCategory ?? "Coiffure");
  const [serviceName, setServiceName] = useState("");
  const [location, setLocation] = useState(props.defaultLocation);
  const [time, setTime] = useState("Aujourd'hui 14h00");
  const [budget, setBudget] = useState(50);
  const [atHome, setAtHome] = useState(true);
  const [comment, setComment] = useState("");
  const [phase, setPhase] = useState<"form" | "waiting" | "matched">("form");
  const [matched, setMatched] = useState<{ proId: string; serviceName: string; time: string; price: number } | null>(null);

  useEffect(() => {
    if (props.open) {
      setPhase("form");
      setMatched(null);
      setCategory(props.defaultCategory ?? "Coiffure");
      setLocation(props.defaultLocation);
    }
  }, [props.open]);

  function submit() {
    const eligibles = findEligibleProsForRequest({ category, budget, atHome });
    if (eligibles.length === 0) {
      toast.error("Aucun pro éligible pour cette demande");
      return;
    }
    const req = createRequest({
      category,
      serviceName: serviceName || category,
      location,
      when: time,
      budget,
      comment,
    });
    setPhase("waiting");

    // Simulate the first eligible pro accepting after a short delay
    const winner = eligibles.sort((a, b) => a.distanceKm - b.distanceKm)[0];
    setTimeout(() => {
      matchRequest(req.id, winner.id);
      const finalPrice = Math.min(budget, winner.price);
      addBooking({
        proId: winner.id,
        serviceName: serviceName || category,
        date: new Date().toISOString().slice(0, 10),
        time,
        price: finalPrice,
        mode: atHome ? "home" : winner.modes[0],
      });
      pushNotification({
        title: `${winner.name.split(" ")[0]} a accepté votre demande`,
        body: `${serviceName || category} — ${time}`,
      });
      setMatched({ proId: winner.id, serviceName: serviceName || category, time, price: finalPrice });
      setPhase("matched");
    }, 3500);
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-primary p-5 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground flex items-center gap-2">
              <Zap className="w-5 h-5" /> Demande instantanée
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              On envoie votre demande à tous les pros compatibles. Le premier qui accepte la prend.
            </DialogDescription>
          </DialogHeader>
        </div>

        {phase === "form" && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <Field label="Catégorie">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      category === c ? "border-primary bg-accent text-primary" : "border-border hover:bg-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Prestation souhaitée">
              <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Ex: Brushing, massage suédois…"
                className="w-full h-11 px-3 rounded-xl border border-border bg-secondary outline-none focus:border-primary text-sm" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lieu">
                <input value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-secondary outline-none focus:border-primary text-sm" />
              </Field>
              <Field label="Quand">
                <input value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-secondary outline-none focus:border-primary text-sm" />
              </Field>
            </div>
            <Field label={`Budget max : ${budget} €`}>
              <input type="range" min={20} max={200} step={5} value={budget}
                onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-primary" />
            </Field>
            <Field label="Mode">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={atHome} onChange={(e) => setAtHome(e.target.checked)} className="accent-primary" />
                À mon domicile
              </label>
            </Field>
            <Field label="Commentaire (optionnel)">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border bg-secondary outline-none focus:border-primary text-sm" />
            </Field>

            <button onClick={submit}
              className="w-full bg-gradient-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold shadow-glow flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Envoyer ma demande
            </button>
          </div>
        )}

        {phase === "waiting" && (
          <div className="p-8 text-center">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mt-5">Recherche en cours…</h3>
            <p className="text-sm text-muted-foreground mt-1">
              On a notifié {findEligibleProsForRequest({ category, budget, atHome }).length} pros compatibles autour de vous.
            </p>
          </div>
        )}

        {phase === "matched" && matched && (
          <div className="p-8 text-center">
            <div className="relative w-20 h-20 mx-auto rounded-full bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h3 className="font-semibold text-lg mt-4">Pro trouvé !</h3>
            <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl bg-secondary text-left">
              <img src={getPro(matched.proId).avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
              <div>
                <div className="font-semibold text-sm">{getPro(matched.proId).name}</div>
                <div className="text-xs text-muted-foreground">{matched.serviceName} · {matched.time}</div>
              </div>
              <div className="ml-auto font-semibold">{matched.price} €</div>
            </div>
            <button onClick={() => { props.onOpenChange(false); navigate({ to: "/reservations" }); }}
              className="mt-5 w-full bg-gradient-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold shadow-glow">
              Voir ma réservation
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </div>
  );
}

/* -------------------- Filters Dialog -------------------- */

function FiltersDialog(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  filters: { categories: string[]; atHome: boolean; maxKm: number };
  onToggle: (c: string) => void;
  onSetFilters: (f: Partial<{ atHome: boolean; maxKm: number }>) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filtres</DialogTitle>
          <DialogDescription>Affinez votre recherche de pros.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <Field label="Catégories">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = props.filters.categories.includes(c);
                return (
                  <button key={c} onClick={() => props.onToggle(c)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      active ? "border-primary bg-accent text-primary" : "border-border hover:bg-secondary"
                    }`}>{c}</button>
                );
              })}
            </div>
          </Field>
          <Field label={`Rayon max : ${props.filters.maxKm} km`}>
            <input type="range" min={1} max={20} value={props.filters.maxKm}
              onChange={(e) => props.onSetFilters({ maxKm: Number(e.target.value) })}
              className="w-full accent-primary" />
          </Field>
          <Field label="Mode">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={props.filters.atHome}
                onChange={(e) => props.onSetFilters({ atHome: e.target.checked })}
                className="accent-primary" />
              Uniquement à domicile
            </label>
          </Field>
          <button onClick={() => props.onOpenChange(false)}
            className="w-full bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow">
            Appliquer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- AI assistant -------------------- */

function AIAssistant({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const setSearchQuery = useBooker((s) => s.setSearchQuery);
  const suggestions = [
    { q: "Un coiffeur près de moi maintenant", pick: "camille" },
    { q: "Un massage cet après-midi", pick: "nicolas" },
    { q: "Une maquilleuse pour ce soir", pick: "laura" },
  ];
  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl max-w-md w-full shadow-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-primary p-5 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <div className="font-semibold">Booker AI</div>
          </div>
          <p className="text-sm mt-1 opacity-90">Décrivez votre besoin, je trouve le pro parfait.</p>
        </div>
        <div className="p-5 space-y-3">
          {suggestions.map((s) => (
            <button key={s.pick} onClick={() => onPick(s.pick)} className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-accent/30 text-sm transition">
              {s.q}
            </button>
          ))}
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && q) { setSearchQuery(q); onClose(); } }}
              placeholder="Posez votre question..."
              className="w-full h-11 pl-4 pr-12 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary" />
            <button onClick={() => { setSearchQuery(q); onClose(); }}
              className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
