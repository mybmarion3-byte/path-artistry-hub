import type { ProLocation } from "@/hooks/use-pro-locations";
import type { ActivityBlock } from "@/hooks/use-pro-activity-blocks";
import { CalendarWidget } from "./CalendarWidget";
import { ExceptionsCard } from "./ExceptionsCard";
import { SummaryCard } from "./SummaryCard";

type Props = {
  locations: ProLocation[];
  blocks: ActivityBlock[];
};

export function RightSidebar({ locations, blocks }: Props) {
  return (
    <aside className="space-y-5">
      <SummaryCard locations={locations} blocks={blocks} />
      <CalendarWidget />
      <ExceptionsCard />
    </aside>
  );
}