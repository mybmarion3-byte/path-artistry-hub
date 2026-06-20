import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/pro/agenda")({
  head: () => ({ meta: [{ title: "Mon agenda — Booker Pro" }] }),
  component: Page,
});

const WEEK = ["Lun 16", "Mar 17", "Mer 18", "Jeu 19", "Ven 20", "Sam 21", "Dim 22"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

const SLOTS = [
  { day: 0, hour: 9, dur: 1, label: "Brushing · Sophie", color: "bg-emerald-500" },
  { day: 0, hour: 14, dur: 1.5, label: "Couleur · Marion", color: "bg-emerald-500" },
  { day: 1, hour: 10, dur: 2, label: "Balayage · Léa", color: "bg-emerald-500" },
  { day: 2, hour: 11, dur: 1, label: "Coupe · Inès", color: "bg-emerald-500" },
  { day: 3, hour: 15, dur: 1, label: "Brushing · Anna", color: "bg-emerald-500" },
  { day: 4, hour: 9, dur: 2, label: "Couleur · Camille", color: "bg-emerald-500" },
  { day: 5, hour: 14, dur: 1, label: "Brushing · Sarah", color: "bg-emerald-500" },
];

function Page() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Calendar className="w-7 h-7 text-emerald-600" /> Mon agenda
        </h1>
        <p className="text-muted-foreground mt-1">Semaine du 16 au 22 juin</p>

        <div className="mt-6 bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-secondary/50">
            <div />
            {WEEK.map((d) => (
              <div key={d} className="px-2 py-3 text-xs font-semibold text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            <div className="border-r border-border">
              {HOURS.map((h) => (
                <div key={h} className="h-14 px-2 py-1 text-[10px] text-muted-foreground border-b border-border">{h}</div>
              ))}
            </div>
            {WEEK.map((_, dayIdx) => (
              <div key={dayIdx} className="border-r border-border last:border-r-0 relative">
                {HOURS.map((h) => (
                  <div key={h} className="h-14 border-b border-border" />
                ))}
                {SLOTS.filter((s) => s.day === dayIdx).map((s, i) => (
                  <div
                    key={i}
                    className={`absolute left-1 right-1 ${s.color} text-white rounded-lg p-1.5 text-[10px] font-medium shadow-soft`}
                    style={{ top: (s.hour - 8) * 56 + 2, height: s.dur * 56 - 4 }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
