import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/app/AppLayout";
import { listFavorites, toggleFavorite } from "@/lib/favorites.functions";
import { Heart, Inbox, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/favoris")({
  head: () => ({ meta: [{ title: "Favoris — Booker NoW" }] }),
  component: Page,
});

type ProRow = {
  id: string;
  name: string;
  job: string;
  avatar_url: string | null;
  rating: number;
  distance_km: number;
  slug: string;
};

type FavoriteRow = {
  pro_id: string;
  pros: ProRow | ProRow[] | null;
};

function getFavoritePro(row: FavoriteRow) {
  if (Array.isArray(row.pros)) return row.pros[0] ?? null;
  return row.pros;
}

function Page() {
  const queryClient = useQueryClient();
  const fetchFavorites = useServerFn(listFavorites);
  const toggleFavoriteFn = useServerFn(toggleFavorite);

  const {
    data: favorites = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => fetchFavorites(),
  });

  const removeFavorite = useMutation({
    mutationFn: (proId: string) => toggleFavoriteFn({ data: { pro_id: proId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Favori retiré");
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : "Impossible de modifier ce favori");
    },
  });

  const list = (favorites as FavoriteRow[])
    .map(getFavoritePro)
    .filter((pro): pro is ProRow => Boolean(pro));

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <h1 className="text-3xl font-semibold">Mes favoris</h1>
        <p className="text-muted-foreground mt-1">Vos pros préférés à portée de clic.</p>

        {isLoading && (
          <div className="mt-10 bg-card border border-border rounded-3xl p-12 text-center">
            <Loader2 className="w-10 h-10 mx-auto text-muted-foreground animate-spin" />
            <h3 className="text-lg font-semibold mt-3">Chargement des favoris…</h3>
          </div>
        )}

        {!isLoading && isError && (
          <div className="mt-10 bg-card border border-border rounded-3xl p-12 text-center">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold mt-3">Impossible de charger les favoris</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {error instanceof Error ? error.message : "Une erreur est survenue."}
            </p>
          </div>
        )}

        {!isLoading && !isError && list.length === 0 ? (
          <div className="mt-10 bg-card border border-border rounded-3xl p-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold mt-3">Aucun favori</h3>
            <p className="text-muted-foreground text-sm mt-1">Appuyez sur le cœur d'un pro pour le sauvegarder.</p>
            <Link to="/" className="inline-block mt-5 bg-gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium shadow-glow">
              Découvrir les pros
            </Link>
          </div>
        ) : null}

        {!isLoading && !isError && list.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} className="w-14 h-14 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold">
                      {p.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.job}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                      <Star className="w-3 h-3 fill-warning text-warning" />
                      <span className="font-medium">{p.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">• {p.distance_km} km</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFavorite.mutate(p.id)}
                    disabled={removeFavorite.isPending}
                    aria-label="Retirer"
                    className="disabled:opacity-50"
                  >
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
