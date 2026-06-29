import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { CATEGORIES, type Mode } from "@/lib/booker-store";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  MapPin,
  Wallet,
  Bell,
  Shield,
  Home as HomeIcon,
  Building2,
  Video,
  Check,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/parametres")({
  head: () => ({ meta: [{ title: "Paramètres pro — Booker" }] }),
  component: Page,
});

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function getErrorMessage(cause: unknown, fallback: string) {
  if (cause instanceof Error && cause.message) return cause.message;
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = (cause as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function Page() {
  const { user, profile, role, pro, loading, error } = useCurrentUserProfile();
  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Bien-être");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [startingPrice, setStartingPrice] = useState(0);
  const [radiusKm, setRadiusKm] = useState(5);
  const [iban, setIban] = useState("FR76 •••• •••• •••• 1234");
  const [notifs, setNotifs] = useState({ newRequest: true, message: true, marketing: false });
  const [modes, setModes] = useState<Mode[]>(["home"]);
  const [saving, setSaving] = useState(false);
  const [activatingPro, setActivatingPro] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(pro?.name ?? profile?.full_name ?? user.email ?? "");
    setJob(pro?.job ?? "");
    setCategory((CATEGORIES as readonly string[]).includes(pro?.category ?? "") ? (pro?.category as (typeof CATEGORIES)[number]) : "Bien-être");
    setSpecialty(pro?.specialty ?? "");
    setBio(pro?.bio ?? "");
    setAvatarUrl(pro?.avatar_url ?? "");
    setExperienceYears(pro?.experience_years ?? 0);
    setStartingPrice(Number(pro?.starting_price ?? 0));
    setModes((pro?.modes?.filter((mode): mode is Mode => mode === "home" || mode === "studio" || mode === "video") ?? ["home"]) as Mode[]);
  }, [profile?.full_name, pro, user]);

  const completion = useMemo(() => {
    const checks = [name, job, category, specialty, bio, startingPrice > 0, modes.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [bio, category, job, modes.length, name, specialty, startingPrice]);

  function toggleMode(m: Mode) {
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function activateProAccount({ reload = true }: { reload?: boolean } = {}) {
    if (!user) {
      toast.error("Connectez-vous pour activer l'espace professionnel");
      return false;
    }

    setActivatingPro(true);
    try {
      const { error: rpcError } = await (supabase.rpc as any)("become_pro");
      if (rpcError) throw rpcError;
      toast.success("Espace professionnel activé");
      if (reload) window.location.reload();
      return true;
    } catch (cause) {
      toast.error(getErrorMessage(cause, "Impossible d'activer l'espace professionnel"));
      return false;
    } finally {
      setActivatingPro(false);
    }
  }

  async function save() {
    if (!user) {
      toast.error("Connectez-vous pour modifier votre profil pro");
      return;
    }
    if (!name.trim() || !job.trim() || !category || !specialty.trim() || !bio.trim()) {
      toast.error("Complétez les informations publiques essentielles");
      return;
    }
    if (modes.length === 0) {
      toast.error("Sélectionnez au moins un mode de prestation");
      return;
    }

    setSaving(true);
    try {
      if (role !== "pro" && role !== "admin") {
        const activated = await activateProAccount({ reload: false });
        if (!activated) return;
      }

      const cleanName = name.trim();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: cleanName, avatar_url: avatarUrl.trim() || null })
        .eq("id", user.id);
      if (profileError) throw profileError;

      const payload = {
        user_id: user.id,
        slug: pro?.slug ?? `${slugify(cleanName, "pro")}-${user.id.slice(0, 8)}`,
        name: cleanName,
        job: job.trim(),
        category,
        specialty: specialty.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim() || null,
        experience_years: Math.max(0, Number(experienceYears) || 0),
        starting_price: Math.max(0, Number(startingPrice) || 0),
        at_home: modes.includes("home"),
        modes,
      };

      const { error: proError } = await supabase
        .from("pros")
        .upsert(payload, { onConflict: "user_id" });
      if (proError) throw proError;

      toast.success("Profil pro enregistré · vos informations publiques sont à jour");
    } catch (cause) {
      toast.error(getErrorMessage(cause, "Impossible d'enregistrer le profil pro"));
    } finally {
      setSaving(false);
    }
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

        {loading && (
          <section className="bg-card border border-border rounded-3xl p-6 shadow-soft flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement de votre profil professionnel…
          </section>
        )}

        {error && (
          <section className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 text-sm text-destructive">
            {error}
          </section>
        )}

        {!loading && role !== "pro" && role !== "admin" && (
          <section className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Activer votre espace professionnel</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ce compte est actuellement client. Activez le profil pro pour renseigner vos informations publiques et être trouvé par les clients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void activateProAccount();
                }}
                disabled={activatingPro}
                className="shrink-0 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {activatingPro && <Loader2 className="w-4 h-4 animate-spin" />}
                Activer mon profil pro
              </button>
            </div>
          </section>
        )}

        {/* Profil public */}
        <Section icon={<Shield className="w-5 h-5 text-emerald-600" />} title="Profil public" desc="Ce que vos clients voient avant de réserver.">
          <div className="flex gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500" />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-xl font-semibold text-emerald-700">
                {name.charAt(0) || "P"}
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nom affiché">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
                </Field>
                <Field label="Métier">
                  <input value={job} onChange={(e) => setJob(e.target.value)} placeholder="Coiffeuse à domicile" className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Catégorie">
                  <select value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Spécialité">
                  <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Couleur, massage, coaching…" className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
                </Field>
              </div>
              <Field label="Photo de profil">
                <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
              </Field>
              <Field label="Bio">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full p-3 rounded-lg border border-border bg-background text-sm" />
              </Field>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Profil complété</span>
              <span className="font-semibold text-emerald-700">{completion}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </Section>

        {/* Modes de prestation */}
        <Section icon={<Settings className="w-5 h-5 text-emerald-600" />} title="Modes de prestation" desc="Cochez uniquement les modes que vous proposez. Les clients ne verront que ceux-ci.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([
              { m: "home" as Mode, label: "À domicile", sub: "Vous vous déplacez chez le client", Icon: HomeIcon },
              { m: "studio" as Mode, label: "En établissement", sub: "Le client vient à votre adresse", Icon: Building2 },
              { m: "video" as Mode, label: "En visio", sub: "Séance à distance", Icon: Video },
            ]).map(({ m, label, sub, Icon }) => {
              const active = modes.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMode(m)}
                  className={`relative text-left p-4 rounded-2xl border transition ${
                    active
                      ? "border-emerald-500 bg-emerald-500/5 shadow-soft"
                      : "border-border hover:border-emerald-500/40 hover:bg-secondary"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${active ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                  {active && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {modes.length === 0 && (
            <div className="text-xs text-destructive mt-1">Vous devez proposer au moins un mode.</div>
          )}
        </Section>

        {/* Zone */}
        <Section icon={<MapPin className="w-5 h-5 text-emerald-600" />} title="Zone d'intervention" desc="Définissez votre rayon et vos informations de recherche.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={`Rayon · ${radiusKm} km`}>
              <input type="range" min={1} max={20} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-full accent-emerald-500" />
            </Field>
            <Field label="Prix de départ">
              <input type="number" min={0} value={startingPrice} onChange={(e) => setStartingPrice(Number(e.target.value))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
            </Field>
          </div>
          <Field label="Années d'expérience">
            <input type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
          </Field>
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
                type="button"
                onClick={() => setNotifs({ ...notifs, [k]: !notifs[k] })}
                className={`w-11 h-6 rounded-full transition relative ${notifs[k] ? "bg-emerald-500" : "bg-secondary"}`}
              >
                <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition" style={{ left: notifs[k] ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </label>
          ))}
        </Section>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving || loading} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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
