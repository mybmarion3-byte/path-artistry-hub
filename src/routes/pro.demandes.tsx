import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { listProBookings, updateProBookingStatus } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, Check, X, MapPin, Clock, Zap, Filter, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/demandes")({
  head: () => ({ meta: [{ title: "Demandes entrantes — Booker Pro" }] }),
  component: Page,
});

type BookingRow = {
  id: string;
  service_name: string;
  address_text: string | null;
  phone: string | null;
  mode: string;
  start_at: string;
  price: number | string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  profiles?: {
    full_name: string | null;
    phone: string | null;
  } | null;
  client_addresses?: {
    label: string | null;
    address: string | null;
    kind: string | null;
  } | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} · ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchBookings = useServerFn(listProBookings);
  const updateStatus = useServerFn(updateProBookingStatus);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({ minBudget: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/pro/demandes" } });
    });
  }, [navigate]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "pro"],
    queryFn: () => fetchBookings(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "confirmed" | "cancelled" }) =>
      updateStatus({ data: { id, status } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "pro"] });
      toast.success(variables.status === "confirmed" ? "Demande acceptée" : "Demande déclinée");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour la demande"),
  });

  const rows = bookings as BookingRow[];
  const filtered = useMemo(
    () => rows.filter((booking) => Number(booking.price) >= filter.minBudget),
    [filter.minBudget, rows],
  );
  const pending = filtered.filter((booking) => booking.status === "pending");
  const handled = filtered.filter((booking) => booking.status !== "pending");

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Inbox className="w-7 h-7 text-emerald-600" /> Demandes entrantes
            </h1>
            <p className="text-muted-foreground mt-1">{pending.length} en attente · {handled.length} traitées</p>
          </div>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-sm transition ${
              showFilter ? "bg-emerald-500 text-white border-emerald-500" : "border-border hover:bg-secondary"
            }`}
          >
            <Filter className="w-4 h-4" /> Filtrer
          </button>
        </div>

        {showFilter && (
          <div className="mt-4 bg-card border border-border rounded-2xl p-5 shadow-soft flex gap-6 items-end">
            <label className="flex-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Budget min · {filter.minBudget} €</div>
              <input
                type="range" min={0} max={150} step={5} value={filter.minBudget}
                onChange={(e) => setFilter({ minBudget: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </label>
            <button onClick={() => setFilter({ minBudget: 0 })} className="text-xs text-muted-foreground hover:underline">
              Réinitialiser
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {isLoading && (
            <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto animate-spin" />
              <p className="text-sm mt-3">Chargement des demandes…</p>
            </div>
          )}

          {!isLoading && pending.length === 0 && (
            <div className="bg-card border border-border rounded-3xl p-12 text-center">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold mt-3">Boîte vide</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Les nouvelles réservations apparaîtront ici quand un client réservera votre profil.
              </p>
              <Link to="/pro" className="inline-block mt-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
                Retour au tableau de bord
              </Link>
            </div>
          )}

          {pending.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              busy={mutation.isPending}
              onConfirm={() => mutation.mutate({ id: booking.id, status: "confirmed" })}
              onCancel={() => mutation.mutate({ id: booking.id, status: "cancelled" })}
            />
          ))}

          {handled.length > 0 && (
            <div className="pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Historique</h2>
              {handled.map((booking) => (
                <div key={booking.id} className="flex items-center gap-3 p-3 border border-border rounded-xl mb-2 opacity-80">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{booking.service_name} — {booking.profiles?.full_name ?? "Client"}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(booking.start_at)}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                    booking.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {booking.status === "confirmed" ? "Acceptée" : booking.status === "cancelled" ? "Déclinée" : booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function BookingCard({
  booking,
  busy,
  onConfirm,
  onCancel,
}: {
  booking: BookingRow;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const addressText = booking.client_addresses?.address ?? booking.address_text ?? booking.mode;
  const clientPhone = booking.phone ?? booking.profiles?.phone;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:border-emerald-500/40 transition">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold">{booking.service_name}</h3>
            <span className="text-sm text-muted-foreground">· {booking.profiles?.full_name ?? "Client"}</span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {addressText}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(booking.start_at)}</span>
            {clientPhone && <span>{clientPhone}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-semibold">{Number(booking.price).toFixed(0)} €</div>
          <div className="text-xs text-muted-foreground">budget client</div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          disabled={busy}
          onClick={onConfirm}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Accepter
        </button>
        <button
          disabled={busy}
          onClick={onCancel}
          className="px-5 border border-border rounded-xl text-sm hover:bg-secondary disabled:opacity-60 flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Décliner
        </button>
      </div>
    </div>
  );
}
