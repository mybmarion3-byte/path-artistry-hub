import { useMemo, useState, useEffect } from "react";
import {
  Star, Heart, Search, Filter, ArrowUpDown, MapIcon, List as ListIcon,
  Sparkles, Home as HomeIcon, ShieldCheck, CreditCard, MessageCircle,
  CheckCircle2, X, Send, Clock, Zap, Video, Building2, ArrowRight, Loader2, Check,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PROS, getPro, useBooker, CATEGORIES, type Pro, type Mode, type Service } from "@/lib/booker-store";
import { matchPros, findEligibleProsForRequest, type MatchResult } from "@/lib/matching";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import mapBg from "@/assets/map-paris.jpg";

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
          const etaMin = Math.max(8, Math.round(p.distanceKm * 6 + 6));
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
                  <><Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" /> Disponible dans {etaMin} min</>
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
  const { view, setView, results, selectedId, onSelect } = props;
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
            const etaMin = Math.max(8, Math.round(p.distanceKm * 6 + 6));
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
  const etaMin = Math.max(8, Math.round(pro.distanceKm * 6 + 6));
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
          </div>
          <div className="text-xs text-emerald-700/80 mt-1">Premier créneau : {firstSlotLabel}</div>
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
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);
  const [slotIso, setSlotIso] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<Mode>("home");

  useEffect(() => {
    if (state) {
      setStep(1);
      setServiceId(state.service?.id ?? state.pro.services[0].id);
      setSlotIso(state.slotIso);
      setMode(state.pro.modes[0]);
    }
  }, [state?.pro.id, state?.service?.id, state?.slotIso]);

  const proId = state?.pro.id ?? PROS[0].id;
  const slots = useBookerSlots(proId);

  if (!state) return null;
  const pro = state.pro;
  const service = pro.services.find((s) => s.id === serviceId) ?? pro.services[0];
  const slot = slots.find((s) => s.iso === slotIso) ?? slots[0];

  const serviceFee = Math.round(service.price * 0.05);
  const total = service.price + serviceFee;

  function confirm() {
    addBooking({
      proId: pro.id,
      serviceId: service.id,
      serviceName: service.name,
      mode,
      date: slot?.iso.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      time: slot?.label ?? "—",
      price: total,
    });
    pushNotification({
      title: `Réservation confirmée avec ${pro.name.split(" ")[0]}`,
      body: `${service.name} — ${slot?.label}`,
    });
    toast.success("Réservation confirmée !", {
      description: `${pro.name.split(" ")[0]} — ${service.name} · ${slot?.label}`,
    });
    onClose();
    navigate({ to: "/reservations" });
  }

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
            <DialogDescription className="sr-only">Tunnel de réservation en 3 étapes</DialogDescription>
          </DialogHeader>
          <Stepper step={step} total={3} />
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div>
              <div className="text-sm font-semibold mb-2">Prestation</div>
              <div className="space-y-2">
                {pro.services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl border text-left ${
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

              <div className="text-sm font-semibold mt-5 mb-2">Mode</div>
              <div className="flex gap-2">
                {pro.modes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-1.5 ${
                      mode === m ? "border-primary bg-accent" : "border-border"
                    }`}
                  >
                    {m === "home" ? "À domicile" : m === "studio" ? "Studio" : "Visio"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-sm font-semibold mb-2">Choisir un créneau</div>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
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
          )}

          {step === 3 && (
            <div>
              <div className="text-sm font-semibold mb-3">Récapitulatif</div>
              <div className="rounded-2xl border border-border divide-y divide-border text-sm">
                <Row label="Pro" value={pro.name} />
                <Row label="Prestation" value={`${service.name} (${service.duration} min)`} />
                <Row label="Créneau" value={slot?.label ?? "—"} />
                <Row label="Mode" value={mode === "home" ? "À domicile" : mode === "studio" ? "Studio" : "Visio"} />
                <Row label="Prix prestation" value={`${service.price} €`} />
                <Row label="Frais de service" value={`${serviceFee} €`} />
                <Row label="Total" value={`${total} €`} bold />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Paiement sécurisé à la réservation. Annulation gratuite jusqu'à 4 h avant.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-between gap-2">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary">
              Retour
            </button>
          ) : <span />}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && !slotIso}
              className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={confirm}
              className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Confirmer — {total} €
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
