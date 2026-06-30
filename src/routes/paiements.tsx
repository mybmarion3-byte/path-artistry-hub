import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { listMyBookings } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Plus } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/paiements")({
  head: () => ({ meta: [{ title: "Paiements — Booker NoW" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const fetchBookings = useServerFn(listMyBookings);
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", "me", "payments"],
    queryFn: () => fetchBookings(),
  });
  const rows = bookings as any[];
  const paidRows = rows.filter((b) => b.status !== "cancelled");
  const total = paidRows.reduce((sum, b) => sum + Number(b.price), 0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/paiements" } });
    });
  }, [navigate]);

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <h1 className="text-3xl font-semibold">Paiements</h1>
        <p className="text-muted-foreground mt-1">Vos moyens de paiement et historique.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Stat label="Dépensé ce mois" value={`${total} €`} />
          <Stat label="Transactions" value={String(rows.length)} />
          <Stat label="Économies fidélité" value="12 €" />
        </div>

        <h2 className="text-lg font-semibold mt-10">Moyens de paiement</h2>
        <div className="mt-4 space-y-3">
          <Card brand="Visa" last4="4242" exp="08/28" primary />
          <Card brand="Mastercard" last4="1881" exp="03/27" />
          <button className="w-full border-2 border-dashed border-border rounded-2xl p-5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter une carte
          </button>
        </div>

        <h2 className="text-lg font-semibold mt-10">Historique</h2>
        <div className="mt-4 bg-card border border-border rounded-2xl divide-y divide-border">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground text-center">Chargement...</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">Aucune transaction.</div>
          ) : (
            rows.map((b) => {
              const p = b.pros;
              const start = new Date(b.start_at);
              return (
                <div key={b.id} className="p-4 flex items-center gap-3">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-semibold">
                      {(p?.name ?? "P").charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p?.name ?? "Pro"}</div>
                    <div className="text-xs text-muted-foreground">
                      {start.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} •{" "}
                      {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className={`font-semibold ${b.status === "cancelled" ? "line-through text-muted-foreground" : ""}`}>
                    {Number(b.price).toFixed(0)} €
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Card({ brand, last4, exp, primary }: { brand: string; last4: string; exp: string; primary?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl flex items-center gap-4 ${primary ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border"}`}>
      <CreditCard className="w-7 h-7" />
      <div className="flex-1">
        <div className="font-semibold">{brand} •••• {last4}</div>
        <div className={`text-xs ${primary ? "opacity-80" : "text-muted-foreground"}`}>Expire {exp}</div>
      </div>
      {primary && <span className="text-[11px] font-semibold bg-card/20 px-2 py-0.5 rounded-full">Par défaut</span>}
    </div>
  );
}
