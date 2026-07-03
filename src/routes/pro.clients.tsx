import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Star, Search, Crown, Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { listProBookings } from "@/lib/bookings.functions";

export const Route = createFileRoute("/pro/clients")({
  head: () => ({ meta: [{ title: "Mes clients — Booker Pro" }] }),
  component: Page,
});

type BookingRow = {
  id: string;
  client_id: string;
  service_name: string;
  start_at: string;
  price: number | string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  profiles?: {
    full_name: string | null;
    phone: string | null;
  } | null;
};

type ClientSummary = {
  id: string;
  name: string;
  phone: string | null;
  visits: number;
  spent: number;
  rating: number;
  vip: boolean;
  lastService: string;
  lastDate: string;
};

function Page() {
  const fetchBookings = useServerFn(listProBookings);
  const [q, setQ] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "pro", "clients"],
    queryFn: () => fetchBookings(),
  });

  const clients = useMemo(() => {
    const byClient = new Map<string, ClientSummary & { lastTime: number }>();

    for (const booking of bookings as unknown as BookingRow[]) {
      if (booking.status === "cancelled") continue;

      const start = new Date(booking.start_at);
      const existing = byClient.get(booking.client_id);
      const spent = Number(booking.price);
      const base = existing ?? {
        id: booking.client_id,
        name: booking.profiles?.full_name ?? "Client",
        phone: booking.profiles?.phone ?? null,
        visits: 0,
        spent: 0,
        rating: 5,
        vip: false,
        lastService: booking.service_name,
        lastDate: start.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" }),
        lastTime: start.getTime(),
      };

      base.visits += 1;
      base.spent += Number.isFinite(spent) ? spent : 0;

      if (start.getTime() >= base.lastTime) {
        base.lastService = booking.service_name;
        base.lastDate = start.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
        base.lastTime = start.getTime();
      }

      base.vip = base.visits >= 3 || base.spent >= 300;
      byClient.set(booking.client_id, base);
    }

    return Array.from(byClient.values())
      .sort((a, b) => b.lastTime - a.lastTime)
      .map(({ lastTime: _lastTime, ...client }) => client);
  }, [bookings]);

  const filtered = useMemo(
    () => clients.filter((client) => client.name.toLowerCase().includes(q.toLowerCase())),
    [clients, q],
  );

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Users className="w-7 h-7 text-emerald-600" /> Mes clients
            </h1>
            <p className="text-muted-foreground mt-1">
              {clients.length} clients issus des réservations · {clients.filter((client) => client.vip).length} VIP
            </p>
          </div>
          <Link
            to="/pro/demandes"
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
          >
            <Inbox className="w-4 h-4" /> Voir demandes
          </Link>
        </div>

        <div className="mt-5 relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-card text-sm"
          />
        </div>

        <div className="mt-6 bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Client</th>
                <th className="text-left px-5 py-3">Visites</th>
                <th className="text-left px-5 py-3">Dernier service</th>
                <th className="text-left px-5 py-3">Total dépensé</th>
                <th className="text-left px-5 py-3">Note</th>
                <th className="text-left px-5 py-3">Dernier RDV</th>
                <th className="text-left px-5 py-3">Contact</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">Chargement des clients...</td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Aucun client trouvé. Les clients apparaîtront ici après leurs réservations.
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((client) => (
                <tr key={client.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-5 py-3 font-medium">
                    <span className="inline-flex items-center gap-2">
                      {client.vip && <Crown className="w-4 h-4 text-warning fill-warning" />}
                      {client.name}
                    </span>
                  </td>
                  <td className="px-5 py-3">{client.visits}</td>
                  <td className="px-5 py-3 text-muted-foreground">{client.lastService}</td>
                  <td className="px-5 py-3 font-semibold">{client.spent.toFixed(0)} €</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                      {client.rating}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{client.lastDate}</td>
                  <td className="px-5 py-3 text-muted-foreground">{client.phone ?? "Non renseigné"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
