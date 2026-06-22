import { useMemo, useState, useEffect } from "react";
import {
  Star, Heart, Search,
  Sparkles, Home as HomeIcon, ShieldCheck, MessageCircle,
  CheckCircle2, Send, Clock, Zap, Video, Building2, Loader2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PROS, getPro, useBooker, CATEGORIES, type Pro, type Mode, type Service } from "@/lib/booker-store";
import { matchPros, findEligibleProsForRequest, type MatchResult } from "@/lib/matching";
import { useLiveEta } from "@/components/app/booking-hooks";
import { BookingDialog } from "@/components/app/BookingDialog";
import { MapView } from "@/components/app/MapView";
import { ProListColumn } from "@/components/app/ProListColumn";
import { Field } from "@/components/app/booking-ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
        <div className={`grid gap-2 ${pro.modes.length === 1 ? "grid-cols-1" : pro.modes.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {([
            { m: "home" as const, label: "À domicile", emoji: "🏠" },
            { m: "studio" as const, label: "Établissement", emoji: "🏢" },
            { m: "video" as const, label: "Visio", emoji: "💻" },
          ])
            .filter((opt) => pro.modes.includes(opt.m))
            .map((opt) => (
              <div
                key={opt.m}
                className="flex flex-col items-center gap-1 py-2.5 rounded-2xl border border-border bg-card text-[11px] font-medium"
              >
                <span className="text-base leading-none">{opt.emoji}</span>
                <span>{opt.label}</span>
              </div>
            ))}
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
