import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

const DATES = Array.from({ length: 35 }, (_, index) => index + 1);

export function CalendarWidget() {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">Calendrier</h2>
          <p className="text-xs text-muted-foreground">
            Vue rapide des prochains jours
          </p>
        </div>

        <div className="flex gap-1">
          <button className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
        {DAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DATES.map((date) => {
          const isToday = date === 12;
          const hasBlock = [2, 5, 8, 12, 15, 19, 22, 26].includes(date);
          const isException = [14, 27].includes(date);

          return (
            <button
              key={date}
              className={`aspect-square rounded-xl text-sm relative transition ${
                isToday
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-secondary"
              }`}
            >
              {date}

              {hasBlock && !isToday && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}

              {isException && !isToday && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Ouvert
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Exception
        </span>
      </div>
    </section>
  );
}