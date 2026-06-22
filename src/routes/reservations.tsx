import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/app/AppLayout";
import { listMyBookings, cancelBooking } from "@/lib/bookings.functions";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reservations")({
  head: () => ({ meta: [{ title: "Mes réservations — Booker" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const fetchBookings = useServerFn(listMyBookings);
  const cancelFn = useServerFn(cancelBooking);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/reservations" } });
    });
  }, [navigate]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => fetchBookings(),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
      toast.success("Réservation annulée");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <h1 className="text-3xl font-semibold">Mes réservations</h1>
        <p className="text-muted-foreground mt-1">Suivez vos prochains rendez-vous.</p>

        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Chargement…</p>
        ) : bookings.length === 0 ? (
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
            {bookings.map((b: any) => {
              const start = new Date(b.start_at);
              const date = start.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
              const time = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              const proName = b.pros?.name ?? "Pro";
              const proJob = b.pros?.job ?? "";
              const proAvatar = b.pros?.avatar_url;
              const upcoming = b.status === "pending" || b.status === "confirmed";
              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-soft">
                  {proAvatar ? (
                    <img src={proAvatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                      {proName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{proName}</div>
                    <div className="text-sm text-muted-foreground">{proJob} · {b.service_name}</div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {time}</span>
                      {b.address_text && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.address_text}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{Number(b.price).toFixed(0)} €</div>
                    <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      b.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                      b.status === "confirmed" ? "bg-success/10 text-success" :
                      b.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {b.status === "pending" ? "En attente" : b.status === "confirmed" ? "Confirmée" : b.status === "cancelled" ? "Annulée" : "Terminée"}
                    </span>
                  </div>
                  {upcoming && (
                    <button
                      onClick={() => cancelMut.mutate(b.id)}
                      className="w-9 h-9 rounded-full border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 flex items-center justify-center transition"
                      aria-label="Annuler"
                    >
                      <X className="w-4 h-4" />
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
