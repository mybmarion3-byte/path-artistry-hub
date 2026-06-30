import { Building2, Clock, Edit, Home, Monitor, Trash2 } from "lucide-react";
import type { ProLocation } from "@/hooks/use-pro-locations";

export type ActivityBlockView = {
  id: string;
  day: string;
  locationId: string | null;
  startTime: string;
  endTime: string;
  label?: string;
};

function getIcon(type?: string) {
  if (type === "home") return <Home className="w-4 h-4" />;
  if (type === "video") return <Monitor className="w-4 h-4" />;
  return <Building2 className="w-4 h-4" />;
}

export function ScheduleBlock({
  block,
  location,
  onEdit,
  onDelete,
}: {
  block: ActivityBlockView;
  location?: ProLocation;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {getIcon(location?.type)}
          </div>

          <div>
            <h4 className="font-semibold">
              {location?.name ?? block.label ?? "Bloc d'activité"}
            </h4>

            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              {block.startTime} — {block.endTime}
            </div>

            {location && (
              <div className="text-xs text-muted-foreground mt-2">
                {location.city || "Ville à compléter"} · Rayon{" "}
                {location.travel_radius_km} km
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
