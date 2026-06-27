import { Plus } from "lucide-react";
import type { ProLocation } from "@/hooks/use-pro-locations";
import type { ActivityBlock } from "@/hooks/use-pro-activity-blocks";
import { ScheduleBlock } from "./ScheduleBlock";

export function DayCard({
  day,
  dayOfWeek,
  blocks,
  locations,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
}: {
  day: string;
  dayOfWeek: number;
  blocks: ActivityBlock[];
  locations: ProLocation[];
  onAddBlock: (dayOfWeek: number) => void;
  onEditBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
}) {
  const isClosed = blocks.length === 0;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{day}</h3>
          <p className="text-xs text-muted-foreground">
            {isClosed ? "Fermé" : `${blocks.length} bloc${blocks.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddBlock(dayOfWeek)}
          className="h-9 px-3 rounded-xl border border-border hover:bg-secondary text-xs font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {isClosed ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucun bloc de travail ce jour.
          </div>
        ) : (
          blocks.map((block) => (
            <ScheduleBlock
              key={block.id}
              block={{
                id: block.id,
                day: String(block.dayOfWeek),
                locationId: block.locationId,
                startTime: block.startTime,
                endTime: block.endTime,
                label: block.label ?? undefined,
              }}
              location={locations.find((location) => location.id === block.locationId)}
              onEdit={() => onEditBlock(block)}
              onDelete={() => onDeleteBlock(block.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}