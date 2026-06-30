import { AlertCircle, Plus } from "lucide-react";

export function ExceptionsCard() {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">Exceptions</h2>
          <p className="text-xs text-muted-foreground">
            Jours modifiés, fermetures, vacances.
          </p>
        </div>

        <button className="w-9 h-9 rounded-xl border border-border hover:bg-secondary flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <ExceptionItem
          title="14 juillet"
          text="Fermé toute la journée"
          tone="orange"
        />

        <ExceptionItem
          title="27 juillet"
          text="Horaires exceptionnels · 10h–16h"
          tone="emerald"
        />

        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Les exceptions réelles seront branchées ensuite sur Supabase.
        </div>
      </div>
    </section>
  );
}

function ExceptionItem({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "orange" | "emerald";
}) {
  const color =
    tone === "orange"
      ? "bg-orange-50 text-orange-700 border-orange-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100";

  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="flex gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5" />
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs opacity-80 mt-0.5">{text}</div>
        </div>
      </div>
    </div>
  );
}