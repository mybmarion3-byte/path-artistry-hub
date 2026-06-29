import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/app/AppLayout";
import { createReview, listMyReviews, listReviewableBookings } from "@/lib/reviews.functions";
import { Inbox, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/avis")({
  head: () => ({ meta: [{ title: "Avis — Booker NoW" }] }),
  component: Page,
});

type ProRow = {
  id: string;
  name: string;
  job: string;
  avatar_url: string | null;
};

type ReviewRow = {
  id: string;
  booking_id: string | null;
  pro_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  pros: ProRow | ProRow[] | null;
};

type ReviewableBookingRow = {
  id: string;
  pro_id: string;
  service_name: string;
  start_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  pros: ProRow | ProRow[] | null;
};

function getPro(pros: ProRow | ProRow[] | null) {
  if (Array.isArray(pros)) return pros[0] ?? null;
  return pros;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function Page() {
  const queryClient = useQueryClient();
  const fetchReviews = useServerFn(listMyReviews);
  const fetchReviewableBookings = useServerFn(listReviewableBookings);
  const createReviewFn = useServerFn(createReview);

  const [bookingId, setBookingId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
    error: reviewsErrorValue,
  } = useQuery({
    queryKey: ["reviews", "me"],
    queryFn: () => fetchReviews(),
  });

  const {
    data: reviewableBookings = [],
    isLoading: bookingsLoading,
    isError: bookingsError,
    error: bookingsErrorValue,
  } = useQuery({
    queryKey: ["reviews", "reviewable-bookings"],
    queryFn: () => fetchReviewableBookings(),
  });

  const reviewsList = reviews as ReviewRow[];
  const bookingList = reviewableBookings as ReviewableBookingRow[];
  const selectedBookingId = bookingId || bookingList[0]?.id || "";

  const createMutation = useMutation({
    mutationFn: (payload: { booking_id: string; rating: number; comment: string }) =>
      createReviewFn({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setBookingId("");
      setRating(5);
      setComment("");
      toast.success("Avis publié");
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : "Impossible de publier l'avis");
    },
  });

  function submit() {
    if (!selectedBookingId) {
      toast.error("Aucune réservation terminée disponible pour laisser un avis.");
      return;
    }

    createMutation.mutate({
      booking_id: selectedBookingId,
      rating,
      comment,
    });
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <h1 className="text-3xl font-semibold">Avis</h1>
        <p className="text-muted-foreground mt-1">Partagez votre expérience après une réservation terminée.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-8">
          <div className="space-y-3">
            <h2 className="font-semibold">Mes avis</h2>

            {reviewsLoading && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                <p className="text-sm mt-3">Chargement des avis…</p>
              </div>
            )}

            {!reviewsLoading && reviewsError && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Inbox className="w-10 h-10 mx-auto text-muted-foreground" />
                <h3 className="font-semibold mt-3">Impossible de charger les avis</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {reviewsErrorValue instanceof Error ? reviewsErrorValue.message : "Une erreur est survenue."}
                </p>
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviewsList.length === 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 text-sm text-muted-foreground text-center">
                Vous n'avez pas encore publié d'avis.
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviewsList.map((review) => {
              const pro = getPro(review.pros);

              return (
                <div key={review.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    {pro?.avatar_url ? (
                      <img src={pro.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                        {pro?.name?.charAt(0) ?? "P"}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="font-semibold text-sm">{pro?.name ?? "Professionnel"}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(review.created_at)}</div>
                      <Stars value={review.rating} />
                    </div>
                  </div>

                  {review.comment && (
                    <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft h-fit">
            <h3 className="font-semibold">Donner un avis</h3>

            {bookingsLoading && (
              <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement des réservations…
              </div>
            )}

            {!bookingsLoading && bookingsError && (
              <p className="text-sm text-destructive mt-4">
                {bookingsErrorValue instanceof Error ? bookingsErrorValue.message : "Impossible de charger les réservations."}
              </p>
            )}

            {!bookingsLoading && !bookingsError && bookingList.length === 0 && (
              <div className="mt-4 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
                Aucun avis disponible pour le moment. Les avis seront possibles après une réservation terminée.
              </div>
            )}

            {!bookingsLoading && !bookingsError && bookingList.length > 0 && (
              <>
                <label className="block text-xs text-muted-foreground mt-4 mb-1.5">Réservation terminée</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-secondary border border-transparent focus:border-primary outline-none text-sm"
                >
                  {bookingList.map((booking) => {
                    const pro = getPro(booking.pros);

                    return (
                      <option key={booking.id} value={booking.id}>
                        {pro?.name ?? "Professionnel"} — {booking.service_name} — {formatDate(booking.start_at)}
                      </option>
                    );
                  })}
                </select>

                <label className="block text-xs text-muted-foreground mt-4 mb-1.5">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)}>
                      <Star className={`w-7 h-7 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>

                <label className="block text-xs text-muted-foreground mt-4 mb-1.5">Commentaire</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Décrivez votre expérience..."
                  className="w-full p-3 rounded-xl bg-secondary border border-transparent focus:border-primary outline-none text-sm resize-none"
                />

                <button
                  onClick={submit}
                  disabled={createMutation.isPending}
                  className="w-full mt-4 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium shadow-glow disabled:opacity-50"
                >
                  {createMutation.isPending ? "Publication…" : "Publier l'avis"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? "fill-warning text-warning" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}
