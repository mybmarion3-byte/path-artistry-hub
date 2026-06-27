import { CalendarDays, Clock, MapPin, Sparkles } from "lucide-react";
import type { ProLocation } from "@/hooks/use-pro-locations";
import type { ActivityBlock } from "@/hooks/use-pro-activity-blocks";

type Props = {
  locations: ProLocation[];
  blocks: ActivityBlock[];
};

export function SummaryCard({ locations, blocks }: Props) {
  const activeLocations = locations.filter((location) => location.active);
  const openedDays = new Set(blocks.map((block) => block.dayOfWeek)).size;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>

        <div>
          <h2 className="font-semibold">Résumé de mon activité</h2>
          <p className="text-xs text-muted-foreground">
            Votre organisation actuelle
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <SummaryLine
          icon={<MapPin className="w-4 h-4" />}
          label={`${activeLocations.length} lieu${
            activeLocations.length > 1 ? "x" : ""
          } de travail`}
          detail={formatLocations(activeLocations)}
        />

        <SummaryLine
          icon={<CalendarDays className="w-4 h-4" />}
          label={`${openedDays} jour${openedDays > 1 ? "s" : ""} ouvert${
            openedDays > 1 ? "s" : ""
          }`}
          detail="Selon votre semaine type"
        />

        <SummaryLine
          icon={<Clock className="w-4 h-4" />}
          label={`${blocks.length} bloc${blocks.length > 1 ? "s" : ""} d’activité`}
          detail="Créneaux de travail configurés"
        />

        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
          <div className="text-sm font-semibold text-emerald-700">
            Prochaine disponibilité
          </div>
          <div className="text-lg font-semibold text-emerald-700 mt-1">
            Aujourd’hui à 14:00
          </div>
          <div className="text-xs text-emerald-700/70 mt-1">
            Aperçu temporaire, calcul réel à brancher ensuite.
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryLine({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>

      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

function formatLocations(locations: ProLocation[]) {
  if (locations.length === 0) return "Aucun lieu configuré";

  const home = locations.filter((location) => location.type === "home").length;
  const salon = locations.filter((location) => location.type === "salon").length;
  const coworking = locations.filter(
    (location) => location.type === "coworking",
  ).length;
  const video = locations.filter((location) => location.type === "video").length;

  const parts = [
    home > 0 ? `${home} domicile` : null,
    salon > 0 ? `${salon} salon` : null,
    coworking > 0 ? `${coworking} coworking` : null,
    video > 0 ? `${video} visio` : null,
  ].filter(Boolean);

  return parts.join(", ");
}