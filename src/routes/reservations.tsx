import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker, getPro } from "@/lib/booker-store";
import { Calendar, Clock, MapPin, X, Star } from "lucide-react";

export const Route = createFileRoute("/reservations")({
  head: () => ({ meta: [{ title: "Mes réservations — Booker NoW" }] }),
  component: Page,
});

function Page() {
  const bookings = useBooker((s) => s.bookings);
  const cancel = useBooker((s) => s.cancelBooking);

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <h1 className="text-3xl font-semibold">Mes réservations</h1>
        <p className="text-muted-foreground mt-1">Suivez vos prochains rendez-vous.</p>

        {bookings.length === 0 ? (
          <div className="mt-10 bg-card border border-border rounded-3xl p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold mt-3">Aucune réservation</h3>
            <p className="text-muted-foreground text-sm mt-1">Trouvez votre prochain pro sur l'accueil.</p>
            <Link to="/" className="inline-block mt-5 bg-gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium shadow-glow">
              Découvrir les pros
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {bookings.map((b) => {
              const pro = getPro(b.proId);
              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-soft">
                  <img src={pro.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{pro.name}</div>
                    <div className="text-sm text-muted-foreground">{pro.job}</div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> À domicile</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{b.price} €</div>
                    <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      b.status === "upcoming" ? "bg-success/10 text-success" :
                      b.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {b.status === "upcoming" ? "À venir" : b.status === "cancelled" ? "Annulée" : "Terminée"}
                    </span>
                  </div>
                  {b.status === "upcoming" && (
                    <button
                      onClick={() => cancel(b.id)}
                      className="w-9 h-9 rounded-full border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 flex items-center justify-center transition"
                      aria-label="Annuler"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {b.status === "completed" && (
                    <button className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-secondary flex items-center gap-1">
                      <Star className="w-4 h-4" /> Noter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
