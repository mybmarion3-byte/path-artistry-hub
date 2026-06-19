import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker, getPro, PROS } from "@/lib/booker-store";
import { Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/avis")({
  head: () => ({ meta: [{ title: "Avis — Booker 2030" }] }),
  component: Page,
});

function Page() {
  const reviews = useBooker((s) => s.reviews);
  const addReview = useBooker((s) => s.addReview);
  const [proId, setProId] = useState(PROS[0].id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  function submit() {
    if (!comment.trim()) return;
    addReview({ proId, rating, comment });
    setComment("");
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl">
        <h1 className="text-3xl font-semibold">Avis</h1>
        <p className="text-muted-foreground mt-1">Partagez votre expérience.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-8">
          <div className="space-y-3">
            <h2 className="font-semibold">Mes avis</h2>
            {reviews.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-6 text-sm text-muted-foreground text-center">
                Vous n'avez pas encore d'avis. Écrivez-en un !
              </div>
            ) : (
              reviews.map((r) => {
                const p = getPro(r.proId);
                return (
                  <div key={r.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                    <div className="flex items-center gap-3">
                      <img src={p.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{p.name}</div>
                        <Stars value={r.rating} />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft h-fit">
            <h3 className="font-semibold">Donner un avis</h3>
            <label className="block text-xs text-muted-foreground mt-4 mb-1.5">Professionnel</label>
            <select value={proId} onChange={(e) => setProId(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-secondary border border-transparent focus:border-primary outline-none text-sm">
              {PROS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="block text-xs text-muted-foreground mt-4 mb-1.5">Note</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={`w-7 h-7 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <label className="block text-xs text-muted-foreground mt-4 mb-1.5">Commentaire</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Décrivez votre expérience..." className="w-full p-3 rounded-xl bg-secondary border border-transparent focus:border-primary outline-none text-sm resize-none" />
            <button onClick={submit} className="w-full mt-4 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium shadow-glow">
              Publier l'avis
            </button>
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
