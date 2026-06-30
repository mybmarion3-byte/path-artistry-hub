import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Home,
  MapPin,
  Scissors,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { AppLayout } from "@/components/app/AppLayout";

export const Route = createFileRoute("/pro/onboarding-offre")({
  head: () => ({ meta: [{ title: "Construire mon activité — Booker Pro" }] }),
  component: ProOfferOnboardingPage,
});

type Profession =
  | "Coiffure"
  | "Esthétique"
  | "Massage"
  | "Onglerie"
  | "Maquillage"
  | "Coaching"
  | "Barber"
  | "Autre";

type WorkLocation = "home" | "studio" | "video" | "other";
type WorkMode = "solo" | "team";

const professions: Profession[] = [
  "Coiffure",
  "Esthétique",
  "Massage",
  "Onglerie",
  "Maquillage",
  "Coaching",
  "Barber",
  "Autre",
];

const steps = [
  "Mon activité",
  "Mon menu",
  "Mes prestations",
  "Personnalisation",
  "Ma page pro",
];

function ProOfferOnboardingPage() {
  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState<Profession>("Coiffure");
  const [locations, setLocations] = useState<WorkLocation[]>(["home"]);
  const [workMode, setWorkMode] = useState<WorkMode>("solo");
  const [zone, setZone] = useState("");

  function toggleLocation(location: WorkLocation) {
    setLocations((current) =>
      current.includes(location)
        ? current.filter((item) => item !== location)
        : [...current, location],
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f7f8f5] p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Booker Pro
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                Commençons par ton activité ✨
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                Dis-nous en plus sur ton métier. Booker construira ensuite ton
                menu, tes prestations et ta page professionnelle.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Progression
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-700">
                Étape {step}/5
              </div>
            </div>
          </header>

          <section className="grid gap-4 rounded-3xl border border-white bg-white p-4 shadow-sm lg:grid-cols-5">
            {steps.map((label, index) => {
              const currentStep = index + 1;
              const isActive = currentStep === step;
              const isDone = currentStep < step;

              return (
                <div
                  key={label}
                  className={`rounded-2xl p-4 transition ${
                    isActive
                      ? "bg-emerald-700 text-white"
                      : isDone
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-50 text-slate-500"
                  }`}
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-emerald-700">
                    {isDone ? <Check className="h-4 w-4" /> : currentStep}
                  </div>
                  <div className="text-sm font-semibold">{label}</div>
                </div>
              );
            })}
          </section>

          {step === 1 ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <main className="space-y-6">
                <Card>
                  <SectionTitle
                    number="01"
                    title="Quel est ton métier principal ?"
                    subtitle="Cela permettra à Booker de proposer un menu adapté."
                  />

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {professions.map((item) => (
                      <button
                        key={item}
                        onClick={() => setProfession(item)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          profession === item
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40"
                        }`}
                      >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Scissors className="h-5 w-5" />
                        </div>
                        <div className="font-semibold">{item}</div>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionTitle
                    number="02"
                    title="Où exerces-tu ?"
                    subtitle="Tu peux sélectionner plusieurs modes de travail."
                  />

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <LocationButton
                      active={locations.includes("home")}
                      icon={<Home className="h-5 w-5" />}
                      title="À domicile"
                      subtitle="Je me déplace chez mes clients."
                      onClick={() => toggleLocation("home")}
                    />
                    <LocationButton
                      active={locations.includes("studio")}
                      icon={<Building2 className="h-5 w-5" />}
                      title="En établissement"
                      subtitle="Salon, cabinet, studio ou espace loué."
                      onClick={() => toggleLocation("studio")}
                    />
                    <LocationButton
                      active={locations.includes("video")}
                      icon={<Video className="h-5 w-5" />}
                      title="En visio"
                      subtitle="Consultation, coaching ou diagnostic."
                      onClick={() => toggleLocation("video")}
                    />
                    <LocationButton
                      active={locations.includes("other")}
                      icon={<MapPin className="h-5 w-5" />}
                      title="Autre lieu"
                      subtitle="Événement, entreprise ou déplacement ponctuel."
                      onClick={() => toggleLocation("other")}
                    />
                  </div>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <SectionTitle
                      number="03"
                      title="Tu exerces..."
                      subtitle="Booker adaptera les options d’équipe."
                    />

                    <div className="mt-5 grid gap-3">
                      <button
                        onClick={() => setWorkMode("solo")}
                        className={`rounded-2xl border p-4 text-left transition ${
                          workMode === "solo"
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-semibold">Seul(e)</div>
                        <div className="mt-1 text-sm text-slate-500">
                          Je gère mon activité seule.
                        </div>
                      </button>

                      <button
                        onClick={() => setWorkMode("team")}
                        className={`rounded-2xl border p-4 text-left transition ${
                          workMode === "team"
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold">
                          <Users className="h-4 w-4" />
                          En équipe
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Je travaille avec plusieurs professionnels.
                        </div>
                      </button>
                    </div>
                  </Card>

                  <Card>
                    <SectionTitle
                      number="04"
                      title="Dans quelle zone travailles-tu ?"
                      subtitle="Cette information aidera Booker à préparer ta page pro."
                    />

                    <div className="mt-5">
                      <input
                        value={zone}
                        onChange={(event) => setZone(event.target.value)}
                        placeholder="Ex : Paris 17e, Rueil-Malmaison, Lyon..."
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500"
                      />
                    </div>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                  >
                    Continuer vers mon menu
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </main>

              <aside className="space-y-6">
                <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <h2 className="text-xl font-semibold">
                    On construit ton activité ensemble
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Booker va te guider étape par étape pour créer une offre
                    claire, simple et prête à être réservée.
                  </p>

                  <div className="mt-6 space-y-3">
                    <ChecklistItem text="Menu personnalisé" />
                    <ChecklistItem text="Descriptions aidées par l’IA" />
                    <ChecklistItem text="Prestations prêtes à utiliser" />
                    <ChecklistItem text="Page pro structurée" />
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                  <div className="text-sm font-semibold text-emerald-900">
                    Aperçu de tes choix
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <PreviewRow label="Métier" value={profession} />
                    <PreviewRow label="Mode" value={workMode === "solo" ? "Solo" : "Équipe"} />
                    <PreviewRow
                      label="Lieux"
                      value={`${locations.length} sélectionné(s)`}
                    />
                    <PreviewRow label="Zone" value={zone || "À compléter"} />
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <PlaceholderStep step={step} setStep={setStep} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}

function SectionTitle({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {number}
      </div>
      <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function LocationButton({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex gap-4 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-emerald-600 bg-emerald-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          active ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </div>

      <div>
        <div className="font-semibold text-slate-950">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
      </div>
    </button>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-200">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-3.5 w-3.5" />
      </div>
      {text}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function PlaceholderStep({
  step,
  setStep,
}: {
  step: number;
  setStep: (step: number) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Sparkles className="h-7 w-7" />
      </div>

      <h2 className="text-2xl font-semibold text-slate-950">
        Étape {step} — bientôt ici
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        On va construire cette étape juste après avoir validé l’écran 1.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={() => setStep(1)}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
        >
          Revenir à l’étape 1
        </button>

        {step < 5 && (
          <button
            onClick={() => setStep(step + 1)}
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Continuer
          </button>
        )}
      </div>
    </section>
  );
}