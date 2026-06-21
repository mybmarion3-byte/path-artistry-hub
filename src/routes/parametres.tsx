import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useState } from "react";
import userMarion from "@/assets/user-marion.jpg";

export const Route = createFileRoute("/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — Booker \Booker NoWnbsp;NoW" }] }),
  component: Page,
});

function Page() {
  const [name, setName] = useState("Marion Lefèvre");
  const [email, setEmail] = useState("marion@booker.fr");
  const [phone, setPhone] = useState("+33 6 12 34 56 78");
  const [notifs, setNotifs] = useState({ push: true, email: true, sms: false });
  const [dark, setDark] = useState(false);

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-semibold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez votre compte et vos préférences.</p>

        <Section title="Profil">
          <div className="flex items-center gap-4">
            <img src={userMarion} className="w-20 h-20 rounded-full object-cover" alt="" />
            <button className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary">Changer la photo</button>
          </div>
          <Field label="Nom complet" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Téléphone" value={phone} onChange={setPhone} />
        </Section>

        <Section title="Notifications">
          <Toggle label="Notifications push" value={notifs.push} onChange={(v) => setNotifs({ ...notifs, push: v })} />
          <Toggle label="Emails" value={notifs.email} onChange={(v) => setNotifs({ ...notifs, email: v })} />
          <Toggle label="SMS" value={notifs.sms} onChange={(v) => setNotifs({ ...notifs, sms: v })} />
        </Section>

        <Section title="Apparence">
          <Toggle label="Mode sombre" value={dark} onChange={(v) => { setDark(v); document.documentElement.classList.toggle("dark", v); }} />
        </Section>

        <Section title="Confidentialité">
          <button className="text-sm text-primary hover:underline">Télécharger mes données</button>
          <button className="text-sm text-destructive hover:underline block mt-3">Supprimer mon compte</button>
        </Section>

        <button className="mt-8 bg-gradient-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-medium shadow-glow">
          Enregistrer les modifications
        </button>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-3xl p-6 mt-6 shadow-soft space-y-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-secondary border border-transparent focus:border-primary outline-none text-sm" />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition relative ${value ? "bg-primary" : "bg-secondary"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card transition ${value ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
