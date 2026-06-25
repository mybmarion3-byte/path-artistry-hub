import { Plus, MapPin } from "lucide-react";
import { LocationCard } from "./LocationCard";
import type { ProLocation } from "@/hooks/use-pro-locations";

type Props = {
  locations: ProLocation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function LocationsSection({
  locations,
  selectedId,
  onSelect,
  onAdd,
}: Props) {
  return (
    <section className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Mes lieux de travail
            </h2>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            Chaque lieu possède sa propre adresse, ses horaires,
            sa visibilité, son rayon d'intervention et ses frais.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau lieu
        </button>

      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {locations.map((location) => (

          <LocationCard
            key={location.id}
            location={location}
            selected={selectedId === location.id}
            onClick={() => onSelect(location.id)}
          />

        ))}

        <button
          onClick={onAdd}
          className="rounded-3xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[210px] group"
        >

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition">
            <Plus className="w-8 h-8 text-primary" />
          </div>

          <div className="font-semibold text-lg mt-5">
            Ajouter un lieu
          </div>

          <div className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
            Domicile • Salon • Coworking • Visio
          </div>

        </button>

      </div>

    </section>
  );
}