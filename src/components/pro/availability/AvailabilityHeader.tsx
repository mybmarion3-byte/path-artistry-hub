import { Eye, Plus } from "lucide-react";

export function AvailabilityHeader() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">Disponibilités</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos jours d’ouverture, horaires, lieux et exceptions.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Aperçu client
        </button>

        <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une disponibilité
        </button>
      </div>
    </div>
  );
}