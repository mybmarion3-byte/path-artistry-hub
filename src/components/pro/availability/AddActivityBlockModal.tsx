import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ProLocation } from "@/hooks/use-pro-locations";
import type {
  ActivityBlock,
  ActivityBlockDraft,
} from "@/hooks/use-pro-activity-blocks";

const DAYS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

type Props = {
  open: boolean;
  dayOfWeek: number | null;
  locations: ProLocation[];
  block?: ActivityBlock | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (draft: ActivityBlockDraft) => Promise<void>;
};

export function AddActivityBlockModal({
  open,
  dayOfWeek,
  locations,
  block,
  saving = false,
  onClose,
  onSubmit,
}: Props) {
  const firstLocationId = useMemo(() => locations[0]?.id ?? null, [locations]);

  const [locationId, setLocationId] = useState<string | null>(firstLocationId);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;

    setLocationId(block?.locationId ?? firstLocationId);
    setStartTime(block?.startTime ?? "09:00");
    setEndTime(block?.endTime ?? "18:00");
    setLabel(block?.label ?? "");
  }, [open, block, firstLocationId]);

  if (!open || !dayOfWeek) return null;
  const selectedDayOfWeek = dayOfWeek;

  async function handleSubmit() {
    await onSubmit({
      dayOfWeek: selectedDayOfWeek,
      locationId,
      startTime,
      endTime,
      label: label.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              {block ? "Modifier le bloc" : "Nouveau bloc d’activité"}
            </div>
            <h2 className="text-2xl font-semibold mt-1">{DAYS[selectedDayOfWeek]}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez le lieu et les horaires de travail.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Field label="Lieu de travail">
            <select
              value={locationId ?? ""}
              onChange={(event) => setLocationId(event.target.value || null)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm"
            >
              <option value="">Sans lieu précis</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Début">
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm"
              />
            </Field>

            <Field label="Fin">
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm"
              />
            </Field>
          </div>

          <Field label="Nom du bloc, optionnel">
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex : Matinée domicile, salon Paris, visio..."
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-border hover:bg-secondary text-sm font-semibold"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : block ? "Enregistrer" : "Créer le bloc"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-2">
        {label}
      </div>
      {children}
    </label>
  );
}
