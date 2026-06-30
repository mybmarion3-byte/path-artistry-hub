import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — Booker NoW" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { user, profile, loading, error } = useCurrentUserProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notifs, setNotifs] = useState({ push: true, email: true, sms: false });
  const [dark, setDark] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/parametres" } });
      return;
    }

    setName(profile?.full_name ?? user.email ?? "");
    setEmail(user.email ?? "");
    setPhone(profile?.phone ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [loading, navigate, profile?.avatar_url, profile?.full_name, profile?.phone, user]);

  async function save() {
    if (!user) {
      toast.error("Connectez-vous pour modifier vos paramètres.");
      return;
    }

    if (!name.trim()) {
      toast.error("Ajoutez votre nom complet.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: name.trim(),
            phone: phone.trim() || null,
            avatar_url: avatarUrl.trim() || null,
          },
          { onConflict: "id" },
        );

      if (updateError) throw updateError;
      toast.success("Profil client enregistré.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-semibold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez votre compte et vos préférences.</p>

        {loading && (
          <section className="bg-card border border-border rounded-3xl p-6 mt-6 shadow-soft flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement de votre profil...
          </section>
        )}

        {error && (
          <section className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 mt-6 text-sm text-destructive">
            {error}
          </section>
        )}

        <Section title="Profil">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-20 h-20 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-semibold">
                {(name || email || "C").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <Field label="Photo de profil" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://..." />
            </div>
          </div>
          <Field label="Nom complet" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} disabled />
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

        <button
          onClick={save}
          disabled={saving || loading}
          className="mt-8 bg-gradient-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-medium shadow-glow disabled:opacity-60 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-11 px-4 rounded-xl bg-secondary border border-transparent focus:border-primary outline-none text-sm disabled:opacity-70"
      />
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
