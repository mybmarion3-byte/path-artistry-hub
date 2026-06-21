import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { PROS, useBooker } from "@/lib/booker-store";
import { Heart, Star } from "lucide-react";

export const Route = createFileRoute("/favoris")({
  head: () => ({ meta: [{ title: "Favoris — Booker NoW" }] }),
  component: Page,
});

function Page() {
  const favs = useBooker((s) => s.favorites);
  const toggle = useBooker((s) => s.toggleFavorite);
  const list = PROS.filter((p) => favs.includes(p.id));

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <h1 className="text-3xl font-semibold">Mes favoris</h1>
        <p className="text-muted-foreground mt-1">Vos pros préférés à portée de clic.</p>

        {list.length === 0 ? (
          <div className="mt-10 bg-card border border-border rounded-3xl p-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold mt-3">Aucun favori</h3>
            <p className="text-muted-foreground text-sm mt-1">Appuyez sur le cœur d'un pro pour le sauvegarder.</p>
            <Link to="/" className="inline-block mt-5 bg-gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium shadow-glow">
              Découvrir les pros
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <img src={p.avatar} className="w-14 h-14 rounded-full object-cover" alt="" />
                  <div className="flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.job}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                      <Star className="w-3 h-3 fill-warning text-warning" />
                      <span className="font-medium">{p.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">• {p.distanceKm} km</span>
                    </div>
                  </div>
                  <button onClick={() => toggle(p.id)} aria-label="Retirer">
                    <Heart className="w-5 h-5 fill-primary text-primary" />
                  </button>
                </div>
                <Link to="/" className="block mt-4 text-center bg-gradient-primary text-primary-foreground rounded-xl py-2 text-sm font-medium shadow-glow">
                  Réserver
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
