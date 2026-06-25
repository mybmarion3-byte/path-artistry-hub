import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

export function Chip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary px-2.5 py-1 rounded-full">
      {children}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export function MiniBtn({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button className="w-12 h-12 rounded-2xl bg-card border border-border flex flex-col items-center justify-center text-xs text-muted-foreground shadow-soft hover:bg-secondary transition">
      <span className="text-base">{children}</span>
      <span className="text-[9px] leading-tight mt-0.5">{label}</span>
    </button>
  );
}

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between px-4 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold text-base" : "font-medium"}>{value}</span>
    </div>
  );
}

export function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
              done ? "bg-success text-success-foreground" :
              active ? "bg-primary text-primary-foreground" :
              "bg-secondary text-muted-foreground"
            }`}>
              {done ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            {n < total && <div className={`flex-1 h-0.5 ${n < step ? "bg-success" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </div>
  );
}
