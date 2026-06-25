import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2,
  Check,
  Home,
  Loader2,
  MapPin,
  Settings,
  Shield,
  User,
  Video,
} from "lucide-react";

type BookingMode = Database["public"]["Enums"]["booking_mode"];

export const Route = createFileRoute("/pro/parametres")({
  head: () => ({ meta: [{ title: "Mon profil professionnel — Booker" }] }),
  component: ProProfilePage,
});

function ProProfilePage() {
  const { user, pro, role, loading, error } = useCurrentUserProfile();

  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [category, setCategory] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [startingPrice, setStartingPrice] = useState(0);
  const [experienceYears, setExperienceYears] = useState(0);
  const [modes, setModes] = useState<BookingMode[]>(["home"]);
  const [mapX, setMapX] = useState(50);
  const [mapY, setMapY] = useState(50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pro) return;

    setName(pro.name ?? "");
    setJob(pro.job ?? "");
    setCategory(pro.category ?? "");
    setSpecialty(pro.specialty ?? "");
    setBio(pro.bio ?? "");
    setStartingPrice(Number(pro.starting_price ?? 0));
    setExperienceYears(Number(pro.experience_years ?? 0));
    setModes((pro.modes ?? ["home"]) as BookingMode[]);
    setMapX(Number(pro.map_x ?? 50));
    setMapY(Number(pro.map_y ?? 50));
  }, [pro]);

  const completion = useMemo(() => {
    let score = 0;

    if (name.trim()) score += 15;
    if (job.trim()) score += 15;
    if (category.trim()) score += 10;
    if (specialty.trim()) score += 10;
    if (bio.trim().length >= 40) score += 20;
    if (startingPrice > 0) score += 10;
    if (experienceYears > 0) score += 10;
    if (modes.length > 0) score += 10;

    return Math.min(score, 100);
  }, [name, job, category, specialty, bio, startingPrice, experienceYears, modes]);

  function toggleMode(mode: BookingMode) {
    setModes((current) =>
      current.includes(mode)
        ? current.filter((item) => item !== mode)
        : [...current, mode],
    );
  }

  async function saveProfile() {
    if (!user || !pro) return;

    if (!name.trim()) {
      toast.error("Ajoutez un nom professionnel.");
      return;
    }

    if (!job.trim()) {
      toast.error("Ajoutez votre métier.");
      return;
    }

    if (modes.length === 0) {
      toast.error("Sélectionnez au moins un mode de prestation.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("pros")
      .update({
        name: name.trim(),
        job: job.trim(),
        category: category.trim() || "Bien-être",
        specialty: specialty.trim() || null,
        bio: bio.trim() || null,
        starting_price: startingPrice,
        experience_years: experienceYears,
        modes,
        at_home: modes.includes("home"),
        map_x: mapX,
        map_y: mapY,
      })
      .eq("id", pro.id)
      .eq("user_id", user.id);

    setSaving(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Profil professionnel enregistré.");
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement du profil professionnel…
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-8 text-red-600">{error}</div>
      </AppLayout>
    );
  }

  if (role !== "pro" && role !== "admin") {
    return (
      <AppLayout>
        <div className="p-8">Cette page est réservée aux professionnels.</div>
      </AppLayout>
    );
  }

  if (!pro) {
    return (
      <AppLayout>
        <div className="p-8">Aucun profil professionnel trouvé.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Espace professionnel
            </div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <Settings className="w-7 h-7 text-emerald-600" />
              Mon profil professionnel
            </h1>
            <p className="text-muted-foreground mt-1">
              Complétez votre fiche pour apparaître correctement côté client.
            </p>
          </div>

          <Badge className="rounded-full px-4 py-2">
            Profil complété à {completion} %
          </Badge>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold">Identité professionnelle</h2>
              <p className="text-xs text-muted-foreground">
                Ces informations sont visibles sur votre fiche publique.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nom affiché">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Field label="Métier">
              <Input value={job} onChange={(e) => setJob(e.target.value)} />
            </Field>

            <Field label="Catégorie">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>

            <Field label="Spécialité">
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </Field>

            <Field label="Prix de départ">
              <Input
                type="number"
                min={0}
                value={startingPrice}
                onChange={(e) => setStartingPrice(Number(e.target.value))}
              />
            </Field>

            <Field label="Années d'expérience">
              <Input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Présentation">
            <Textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Présentez votre activité, votre expérience, votre zone d’intervention et ce qui vous rend unique."
            />
          </Field>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold">Modes de prestation</h2>
              <p className="text-xs text-muted-foreground">
                Les clients ne verront que les modes actifs.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <ModeCard
              active={modes.includes("home")}
              icon={<Home className="w-5 h-5" />}
              title="À domicile"
              text="Vous vous déplacez chez le client."
              onClick={() => toggleMode("home")}
            />

            <ModeCard
              active={modes.includes("studio")}
              icon={<Building2 className="w-5 h-5" />}
              title="En établissement"
              text="Le client vient à votre adresse."
              onClick={() => toggleMode("studio")}
            />

            <ModeCard
              active={modes.includes("video")}
              icon={<Video className="w-5 h-5" />}
              title="En visio"
              text="Prestation ou conseil à distance."
              onClick={() => toggleMode("video")}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold">Position sur la carte</h2>
              <p className="text-xs text-muted-foreground">
                Position provisoire utilisée par la carte Booker.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label={`Position horizontale · ${mapX}`}>
              <Input
                type="range"
                min={0}
                max={100}
                value={mapX}
                onChange={(e) => setMapX(Number(e.target.value))}
              />
            </Field>

            <Field label={`Position verticale · ${mapY}`}>
              <Input
                type="range"
                min={0}
                max={100}
                value={mapY}
                onChange={(e) => setMapY(Number(e.target.value))}
              />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer mon profil"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ModeCard({
  active,
  icon,
  title,
  text,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left p-4 rounded-2xl border transition ${
        active
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      <div className={active ? "text-emerald-600" : "text-muted-foreground"}>{icon}</div>
      <div className="font-semibold mt-3">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{text}</div>

      {active && (
        <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
          <Check className="w-4 h-4" />
        </span>
      )}
    </button>
  );
}