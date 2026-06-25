import { Building2, Home, Monitor, MapPin } from "lucide-react";
import type { ProLocation } from "@/hooks/use-pro-locations";

function iconForType(type: ProLocation["type"]) {
  if (type === "home") return <Home className="w-5 h-5" />;
  if (type === "video") return <Monitor className="w-5 h-5" />;
  return <Building2 className="w-5 h-5" />;
}

export function LocationCard({
  location,
  selected,
  onClick,
}: {
  location: ProLocation;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition ${
        selected
          ? "border-primary bg-primary/5 shadow-soft"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {iconForType(location.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold truncate">{location.name}</div>
            {location.active && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                Actif
              </span>
            )}
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            {location.address || "Adresse à compléter"}
          </div>

          <div className="text-xs text-muted-foreground">
            {[location.postal_code, location.city].filter(Boolean).join(" ")}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
            <MapPin className="w-3 h-3" />
            Rayon {location.travel_radius_km} km
          </div>
        </div>
      </div>
    </button>
  );
}