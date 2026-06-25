import { Clock, Search, ShieldCheck, Star, Zap } from "lucide-react";
import { useBooker } from "@/lib/booker-store";
import type { MatchResult } from "@/lib/matching";
import { useLiveEta } from "@/components/app/booking-hooks";

export function BookingPanel(props: {
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
