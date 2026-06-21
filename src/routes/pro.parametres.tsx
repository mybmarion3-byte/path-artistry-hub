import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker, getPro, type Mode } from "@/lib/booker-store";
import { Settings, MapPin, Wallet, Bell, Shield, Home as HomeIcon, Building2, Video, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/parametres")({
  head: () => ({ meta: [{ title: "Paramètres pro — Booker" }] }),
  component: Page,
});

function Page() {
  const settings = useBooker((s) => s.proSettings);
  const update = useBooker((s) => s.setProSettings);
  const proId = useBooker((s) => s.proIdentityId);
  const setProModes = useBooker((s) => s.setProModes);
  const pro = getPro(proId);

  const [bio, setBio] = useState(pro.bio);
  const [iban, setIban] = useState("FR76 •••• •••• •••• 1234");
  const [notifs, setNotifs] = useState({ newRequest: true, message: true, marketing: false });
  const [modes, setModes] = useState<Mode[]>(pro.modes);

  function toggleMode(m: Mode) {
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function save() {
    if (modes.length === 0) {
      toast.error("Sélectionnez au moins un mode de prestation");
      return;
    }
    setProModes(proId, modes);
    toast.success("Paramètres enregistrés · vos clients ne verront que vos modes actifs");
  }


  return (
    <AppLayout>
      <div className="p-8 max-w-4xl space-y-6">
        <div>
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Espace pro</div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Settings className="w-7 h-7 text-emerald-600" /> Paramètres
          </h1>
          <p className="text-muted-foreground mt-1">Profil public, zone, paiements et notifications.</p>
        </div>

        {/* Profil public */}
        <Section icon={<Shield className="w-5 h-5 text-emerald-600" />} title="Profil public" desc="Ce que vos clients voient avant de réserver.">
          <div className="flex gap-4">
            <img src={pro.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500" />
            <div className="flex-1 space-y-3">
              <Field label="Nom affiché">
                <input value={pro.name} readOnly className="w-full h-10 px-3 rounded-lg border border-border bg-secondary/40 text-sm" />
              </Field>
              <Field label="Bio">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full p-3 rounded-lg border border-border bg-background text-sm" />
              </Field>
            </div>
          </div>
        </Section>

        {/* Zone */}
        <Section icon={<MapPin className="w-5 h-5 text-emerald-600" />} title="Zone d'intervention" desc="Définissez votre rayon et budget minimum.">
          <Field label={`Rayon · ${settings.radiusKm} km`}>
            <input type="range" min={1} max={20} value={settings.radiusKm} onChange={(e) => update({ radiusKm: Number(e.target.value) })} className="w-full accent-emerald-500" />
          </Field>
          <Field label={`Budget minimum accepté · ${settings.minBudget} €`}>
            <input type="range" min={0} max={150} step={5} value={settings.minBudget} onChange={(e) => update({ minBudget: Number(e.target.value) })} className="w-full accent-emerald-500" />
          </Field>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={settings.autoAccept} onChange={(e) => update({ autoAccept: e.target.checked })} className="accent-emerald-500 w-4 h-4" />
            <span className="text-sm">Accepter automatiquement les demandes éligibles</span>
          </label>
        </Section>

        {/* Paiement */}
        <Section icon={<Wallet className="w-5 h-5 text-emerald-600" />} title="Paiement" desc="Vos virements arrivent chaque lundi.">
          <Field label="IBAN">
            <input value={iban} onChange={(e) => setIban(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono" />
          </Field>
          <div className="text-xs text-muted-foreground">Commission Booker : 12% · TVA collectée pour vous</div>
        </Section>

        {/* Notifications */}
        <Section icon={<Bell className="w-5 h-5 text-emerald-600" />} title="Notifications" desc="Choisissez quand être prévenu.">
          {([
            ["newRequest", "Nouvelle demande client"],
            ["message", "Nouveau message"],
            ["marketing", "Conseils & offres Booker"],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm">{label}</span>
              <button
                onClick={() => setNotifs({ ...notifs, [k]: !notifs[k] })}
                className={`w-11 h-6 rounded-full transition relative ${notifs[k] ? "bg-emerald-500" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${notifs[k] ? "left-5.5 translate-x-0" : "left-0.5"}`} style={{ left: notifs[k] ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </label>
          ))}
        </Section>

        <div className="flex justify-end">
          <button onClick={save} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 py-3 text-sm font-semibold">
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-3xl p-6 shadow-soft">
      <div className="flex items-start gap-3 mb-4">
        {icon}
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      {children}
    </label>
  );
}
