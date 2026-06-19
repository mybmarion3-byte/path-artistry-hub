import { useState } from "react";
import { Star, Heart, Plus, Search, Filter, ArrowUpDown, MapIcon, List as ListIcon, Sparkles, Home as HomeIcon, ShieldCheck, CreditCard, MessageCircle, CheckCircle2, X, Send } from "lucide-react";
import { PROS, getPro, useBooker, type Pro } from "@/lib/booker-store";
import mapBg from "@/assets/map-paris.jpg";

const SLOTS = ["14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];

export function HomeScreen() {
  const {
    selectedProId,
    favorites,
    filters,
    view,
    selectPro,
    toggleFavorite,
    addBooking,
    removeFilterCategory,
    clearFilters,
    setView,
  } = useBooker();

  const selected = getPro(selectedProId);
  const [day, setDay] = useState<"today" | "tomorrow">("today");
  const [slot, setSlot] = useState<string>("now");
  const [confirmation, setConfirmation] = useState<null | { proId: string; time: string }>(
    null,
  );
  const [aiOpen, setAiOpen] = useState(false);

  const filtered = PROS.filter((p) => {
    if (filters.categories.length && !filters.categories.includes(p.category)) return false;
    if (filters.atHome && !p.atHome) return false;
    if (p.distanceKm > filters.maxKm) return false;
    return true;
  });

  function handleBook() {
    const time = slot === "now" ? "Maintenant" : slot;
    addBooking({
      proId: selected.id,
      date: new Date().toISOString().slice(0, 10),
      time,
      price: selected.price,
    });
    setConfirmation({ proId: selected.id, time });
  }

  return (
    <div className="grid grid-cols-[340px_1fr_420px] gap-5 p-5 h-[calc(100vh-5rem)]">
      {/* Left column - pro list */}
      <ProListColumn
        filtered={filtered}
        selectedProId={selectedProId}
        favorites={favorites}
        filters={filters}
        onSelect={selectPro}
        onFav={toggleFavorite}
        onRemoveCat={removeFilterCategory}
        onClear={clearFilters}
      />

      {/* Middle - map */}
      <MapView
        view={view}
        setView={setView}
        pros={filtered}
        selectedId={selectedProId}
        onSelect={selectPro}
      />

      {/* Right - selected pro + booking */}
      <BookingPanel
        pro={selected}
        day={day}
        setDay={setDay}
        slot={slot}
        setSlot={setSlot}
        onBook={handleBook}
      />

      {confirmation && (
        <ConfirmationModal
          pro={getPro(confirmation.proId)}
          time={confirmation.time}
          onClose={() => setConfirmation(null)}
        />
      )}

      {/* AI floating button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center text-primary-foreground hover:scale-105 transition"
        aria-label="Booker AI"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {aiOpen && <AIAssistant onClose={() => setAiOpen(false)} onPick={(id) => { selectPro(id); setAiOpen(false); }} />}
    </div>
  );
}

function ProListColumn(props: {
  filtered: Pro[];
  selectedProId: string;
  favorites: string[];
  filters: { categories: string[]; atHome: boolean; maxKm: number };
  onSelect: (id: string) => void;
  onFav: (id: string) => void;
  onRemoveCat: (c: string) => void;
  onClear: () => void;
}) {
  const { filtered, selectedProId, favorites, filters, onSelect, onFav, onRemoveCat, onClear } = props;
  return (
    <div className="bg-card border border-border rounded-3xl p-5 flex flex-col min-h-0 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Dispo maintenant</h2>
            <span className="w-2 h-2 rounded-full bg-success" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} pros disponibles
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="flex-1 h-10 rounded-xl border border-border bg-card flex items-center justify-center gap-2 text-sm font-medium hover:bg-secondary transition">
          <Filter className="w-4 h-4" /> Filtres
          {filters.categories.length + (filters.atHome ? 1 : 0) > 0 && (
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
          <Chip key={c} onRemove={() => onRemoveCat(c)}>{c}</Chip>
        ))}
        {filters.atHome && <Chip onRemove={() => {}}>À domicile</Chip>}
        <Chip onRemove={() => {}}>Moins de {filters.maxKm} km</Chip>
        <button
          onClick={onClear}
          className="text-xs text-primary font-medium hover:underline px-1"
        >
          Effacer tout
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 -mx-2 px-2 space-y-2">
        {filtered.map((p) => {
          const active = p.id === selectedProId;
          const fav = favorites.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full text-left p-3 rounded-2xl border transition relative group ${
                active
                  ? "border-primary bg-accent/40"
                  : "border-border hover:border-primary/40 hover:bg-secondary/50"
              }`}
            >
              {p.availability === "now" && (
                <span className="absolute -top-2 left-12 text-[10px] font-semibold bg-success text-success-foreground px-2 py-0.5 rounded-full">
                  Disponible
                </span>
              )}
              <div className="flex gap-3">
                <div className="relative shrink-0">
                  <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                  {p.availability === "now" && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onFav(p.id); }}
                      className="shrink-0"
                      aria-label="Favori"
                    >
                      <Heart className={`w-4 h-4 ${fav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.job}</div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span className="font-medium">{p.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({p.reviews})</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{p.distanceKm} km</span>
                  </div>
                  <div className={`text-xs font-medium mt-1 ${p.availability === "now" ? "text-success" : "text-muted-foreground"}`}>
                    {p.availability === "now" ? "Disponible maintenant" : `Disponible à ${p.availability}`}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button className="mt-3 text-sm font-medium text-primary py-2 hover:underline">
        Voir plus ({123})
      </button>
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

function MapView(props: {
  view: "map" | "list" | "ai";
  setView: (v: "map" | "list" | "ai") => void;
  pros: Pro[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { view, setView, pros, selectedId, onSelect } = props;
  return (
    <div className="relative rounded-3xl overflow-hidden border border-border shadow-soft bg-secondary">
      <img src={mapBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />

      {/* Top controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <button className="bg-card shadow-card border border-border px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-secondary transition">
          <Search className="w-4 h-4" />
          Recherche dans cette zone
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
        <div className="relative z-10 p-6 grid grid-cols-2 gap-3 overflow-y-auto h-full">
          {pros.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="bg-card rounded-2xl p-4 border border-border text-left hover:border-primary transition flex gap-3 shadow-soft"
            >
              <img src={p.avatar} className="w-14 h-14 rounded-full object-cover" alt="" loading="lazy" />
              <div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.job}</div>
                <div className="text-xs text-primary font-medium mt-1">{p.price} €</div>
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
          {/* Pulse for "you are here" */}
          <div className="absolute left-[55%] top-[58%] -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-32 h-32 rounded-full bg-primary/20 blur-sm" />
            <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-primary border-2 border-card" />
          </div>

          {/* Pro pins */}
          {pros.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <div
                  className={`relative rounded-full p-0.5 transition ${
                    active ? "bg-success scale-110" : "bg-card shadow-card group-hover:scale-105"
                  }`}
                >
                  <img src={p.avatar} className={`rounded-full object-cover ${active ? "w-16 h-16" : "w-12 h-12"}`} alt="" loading="lazy" />
                  {active && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-success text-success-foreground px-2 py-0.5 rounded-full whitespace-nowrap">
                      Maintenant
                    </span>
                  )}
                  {!active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-foreground text-background px-1.5 py-0.5 rounded-full">
                      {p.availability === "now" ? "Maintenant" : p.availability}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </>
      )}

      {/* Right side controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <MiniBtn label="Ma position">📍</MiniBtn>
        <MiniBtn label="Rayon 5 km">⊙</MiniBtn>
        <MiniBtn label="Trafic">🛣️</MiniBtn>
      </div>
      <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-1 bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <button className="w-9 h-9 hover:bg-secondary text-lg">+</button>
        <button className="w-9 h-9 hover:bg-secondary text-lg border-t border-border">−</button>
      </div>
      <button className="absolute right-4 bottom-6 z-10 w-12 h-12 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center text-primary-foreground">
        <Send className="w-5 h-5" />
      </button>
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

function BookingPanel(props: {
  pro: Pro;
  day: "today" | "tomorrow";
  setDay: (d: "today" | "tomorrow") => void;
  slot: string;
  setSlot: (s: string) => void;
  onBook: () => void;
}) {
  const { pro, day, setDay, slot, setSlot, onBook } = props;

  return (
    <div className="bg-card border border-border rounded-3xl p-5 flex flex-col min-h-0 shadow-soft overflow-y-auto">
      <div className="flex gap-3">
        <img src={pro.avatar} className="w-16 h-16 rounded-full object-cover" alt={pro.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold">{pro.name}</h3>
            {pro.verified && <span className="text-primary text-sm">✓</span>}
          </div>
          <div className="text-sm text-muted-foreground">{pro.job}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <Star className="w-3 h-3 fill-warning text-warning" />
            <span className="font-medium">{pro.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({pro.reviews} avis)</span>
          </div>
          {pro.availability === "now" && (
            <div className="flex items-center gap-1 text-xs text-success font-medium mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Disponible maintenant
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><HomeIcon className="w-3 h-3" /> À domicile</span>
        <span>|</span>
        <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Paiement sécurisé</span>
        <span>|</span>
        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Pro certifiée</span>
      </div>

      <div className="mt-4 text-sm">
        <div className="font-semibold">{pro.specialty}</div>
        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{pro.bio}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-xl bg-gradient-soft border border-border" />
        ))}
        <div className="aspect-square rounded-xl bg-foreground/80 text-background flex items-center justify-center font-semibold text-sm">
          +12
        </div>
      </div>

      <button className="mt-3 text-xs font-medium text-primary hover:underline">
        Voir le profil complet
      </button>

      <div className="mt-5">
        <div className="text-sm font-semibold">Prochaines disponibilités</div>
        <div className="flex gap-4 mt-2 border-b border-border">
          {([{ k: "today" as const, l: "Aujourd'hui" }, { k: "tomorrow" as const, l: "Demain" }]).map((d) => (
            <button
              key={d.k}
              onClick={() => setDay(d.k)}
              className={`pb-2 text-sm font-medium relative ${day === d.k ? "text-primary" : "text-muted-foreground"}`}
            >
              {d.l}
              {day === d.k && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        {pro.availability === "now" && (
          <button
            onClick={() => setSlot("now")}
            className={`mt-3 w-full flex items-center justify-between px-3 py-2 rounded-xl border ${
              slot === "now" ? "border-primary bg-accent/50" : "border-border hover:bg-secondary"
            }`}
          >
            <span className="text-sm font-semibold text-success">Maintenant</span>
            <span className="text-xs text-muted-foreground">Arrivée : 10-20 min</span>
          </button>
        )}

        <div className="grid grid-cols-3 gap-2 mt-2">
          {SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={`py-2 rounded-xl text-sm font-medium border transition ${
                slot === s
                  ? "border-primary bg-accent/50 text-primary"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-semibold">{pro.price} €</span>
      </div>

      <button
        onClick={onBook}
        className="mt-3 w-full bg-gradient-primary text-primary-foreground font-semibold rounded-2xl py-3.5 shadow-glow hover:opacity-95 transition"
      >
        Continuer
      </button>
    </div>
  );
}

function ConfirmationModal({ pro, time, onClose }: { pro: Pro; time: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-card relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="relative w-20 h-20 mx-auto rounded-full bg-accent flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mt-4">Réservation confirmée !</h3>
        <p className="text-success font-medium mt-2 text-sm">
          {pro.name.split(" ")[0]} {time === "Maintenant" ? "arrive dans 12 min" : `vous attend à ${time}`}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Vous allez recevoir une notification quand {time === "Maintenant" ? "elle sera en route." : "le créneau approchera."}
        </p>
        <div className="space-y-2 mt-5">
          <button onClick={onClose} className="w-full bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium shadow-glow">
            Voir mes réservations
          </button>
          <button className="w-full border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-secondary flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Contacter {pro.name.split(" ")[0]}
          </button>
        </div>
      </div>
    </div>
  );
}

function AIAssistant({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
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
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Posez votre question..." className="w-full h-11 pl-4 pr-12 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary" />
            <button className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg bg-gradient-primary text-primary-foreground flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
