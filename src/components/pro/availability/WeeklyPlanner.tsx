import type { ProLocation } from "@/hooks/use-pro-locations";
import type { ActivityBlock } from "@/hooks/use-pro-activity-blocks";
import { DayCard } from "./DayCard";

const DAYS = [
  { label: "Lundi", value: 1 },
  { label: "Mardi", value: 2 },
  { label: "Mercredi", value: 3 },
  { label: "Jeudi", value: 4 },
  { label: "Vendredi", value: 5 },
  { label: "Samedi", value: 6 },
  { label: "Dimanche", value: 7 },
];

export function WeeklyPlanner({
  locations,
  blocks,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
}: {
  locations: ProLocation[];
  blocks: ActivityBlock[];
  onAddBlock: (dayOfWeek: number) => void;
  onEditBlock: (block: ActivityBlock) => void;
  onDeleteBlock: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ma semaine type</h2>
        <p className="text-sm text-muted-foreground">
          Organisez votre activité avec des blocs de travail par jour.
        </p>
      </div>

      <div className="grid gap-4">
        {DAYS.map((day) => (
          <DayCard
            key={day.value}
            day={day.label}
            dayOfWeek={day.value}
            locations={locations}
            blocks={blocks.filter((block) => block.dayOfWeek === day.value)}
            onAddBlock={onAddBlock}
            onEditBlock={onEditBlock}
            onDeleteBlock={onDeleteBlock}
          />
        ))}
      </div>
    </section>
  );
}