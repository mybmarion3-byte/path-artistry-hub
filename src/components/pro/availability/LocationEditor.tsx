import {
    Building2,
    Eye,
    Home,
    MapPinned,
    Monitor,
    Navigation,
    Save,
    Sparkles,
  } from "lucide-react";
  
  import type { ReactNode } from "react";
  import type { ProLocation } from "@/hooks/use-pro-locations";
  
  type Props = {
    location?: ProLocation;
    saving?: boolean;
    onChange: (values: Partial<ProLocation>) => void;
    onSave: () => void;
  };
  
  export function LocationEditor({
    location,
    saving = false,
    onChange,
    onSave,
  }: Props) {
    if (!location) {
      return (
        <section className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
  
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
  
            <MapPinned className="h-8 w-8 text-primary" />
  
          </div>
  
          <h2 className="text-xl font-semibold">
            Sélectionnez un lieu
          </h2>
  
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Choisissez un lieu de travail pour modifier son adresse,
            sa visibilité, sa zone d'intervention et les frais de déplacement.
          </p>
  
        </section>
      );
    }
  
    return (
      <section className="space-y-6">
  
        {/* HEADER */}
  
        <div className="rounded-3xl border border-border bg-card shadow-soft p-6">
  
          <div className="flex items-start justify-between gap-6">
  
            <div>
  
              <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
  
                <Sparkles className="w-4 h-4" />
  
                Configuration
  
              </div>
  
              <h2 className="text-2xl font-bold">
                {location.name}
              </h2>
  
              <p className="text-sm text-muted-foreground mt-2">
                Configurez ce lieu de travail. Toutes les modifications
                seront immédiatement prises en compte dans Booker.
              </p>
  
            </div>
  
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-2 font-semibold disabled:opacity-60"
            >
  
              <Save className="w-4 h-4" />
  
              {saving
                ? "Enregistrement..."
                : "Enregistrer"}
  
            </button>
  
          </div>
  
        </div>
  
        {/* CONTENU */}
  
        <div className="grid xl:grid-cols-[1fr_360px] gap-6">
  
          <div className="space-y-6">

                      {/* Informations générales */}

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">

<h3 className="text-lg font-semibold mb-5">
  Informations du lieu
</h3>

<div className="grid md:grid-cols-2 gap-5">

  <Field label="Nom du lieu">

    <input
      value={location.name}
      onChange={(e) =>
        onChange({
          name: e.target.value,
        })
      }
      className="w-full h-11 rounded-xl border border-border bg-background px-4"
    />

  </Field>

  <Field label="Type de lieu">

    <select
      value={location.type}
      onChange={(e) =>
        onChange({
          type: e.target.value as ProLocation["type"],
        })
      }
      className="w-full h-11 rounded-xl border border-border bg-background px-4"
    >

      <option value="home">
        🏠 Domicile
      </option>

      <option value="salon">
        🏢 Salon
      </option>

      <option value="coworking">
        💼 Coworking
      </option>

      <option value="video">
        💻 Visio
      </option>

    </select>

  </Field>

</div>

<div className="grid md:grid-cols-3 gap-5 mt-5">

  <Field label="Adresse">

    <input
      value={location.address}
      placeholder="Adresse"
      onChange={(e) =>
        onChange({
          address: e.target.value,
        })
      }
      className="w-full h-11 rounded-xl border border-border bg-background px-4"
    />

  </Field>

  <Field label="Ville">

    <input
      value={location.city}
      onChange={(e) =>
        onChange({
          city: e.target.value,
        })
      }
      className="w-full h-11 rounded-xl border border-border bg-background px-4"
    />

  </Field>

  <Field label="Code postal">

    <input
      value={location.postal_code}
      onChange={(e) =>
        onChange({
          postal_code: e.target.value,
        })
      }
      className="w-full h-11 rounded-xl border border-border bg-background px-4"
    />

  </Field>

</div>

</div>

{/* Carte Google (prochaine étape) */}

<div className="rounded-3xl border border-border bg-card p-6 shadow-soft">

<div className="flex items-center justify-between mb-4">

  <div>

    <h3 className="text-lg font-semibold">
      Localisation
    </h3>

    <p className="text-sm text-muted-foreground">
      Cette carte deviendra interactive avec Google Maps.
    </p>

  </div>

</div>

<div className="h-[320px] rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/40 to-muted/10 flex flex-col items-center justify-center">

  <MapPinned className="w-12 h-12 text-primary mb-4" />

  <div className="font-semibold">
    Carte interactive
  </div>

  <div className="text-sm text-muted-foreground mt-2">
    Google Maps sera intégrée ici.
  </div>

</div>

</div>
          {/* Déplacements */}

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">

                <Navigation className="w-5 h-5" />

              </div>

              <div>

                <h3 className="text-lg font-semibold">
                  Déplacements
                </h3>

                <p className="text-sm text-muted-foreground">
                  Définissez jusqu'où Booker peut proposer vos services.
                </p>

              </div>

            </div>

            <div className="space-y-8">

              <Field
                label={`Rayon d'intervention • ${location.travel_radius_km} km`}
              >

                <input
                  type="range"
                  min={1}
                  max={80}
                  value={location.travel_radius_km}
                  onChange={(e) =>
                    onChange({
                      travel_radius_km: Number(e.target.value),
                    })
                  }
                  className="w-full accent-primary"
                />

              </Field>

              <Field
                label={`Temps maximum • ${location.travel_time_max_min} min`}
              >

                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={location.travel_time_max_min}
                  onChange={(e) =>
                    onChange({
                      travel_time_max_min: Number(e.target.value),
                    })
                  }
                  className="w-full accent-primary"
                />

              </Field>

            </div>

          </div>

          {/* Frais */}

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">

            <h3 className="text-lg font-semibold mb-5">

              Frais de déplacement

            </h3>

            <div className="grid lg:grid-cols-3 gap-5">

              <Field label="Mode de facturation">

                <select
                  value={location.travel_fee_type}
                  onChange={(e) =>
                    onChange({
                      travel_fee_type: e.target.value,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-border bg-background px-4"
                >

                  <option value="free">
                    Gratuit
                  </option>

                  <option value="per_km">
                    Au kilomètre
                  </option>

                  <option value="fixed">
                    Forfait fixe
                  </option>

                </select>

              </Field>

              <Field label="Gratuit jusqu'à">

                <input
                  type="number"
                  min={0}
                  value={location.travel_fee_free_until_km}
                  onChange={(e) =>
                    onChange({
                      travel_fee_free_until_km: Number(
                        e.target.value,
                      ),
                    })
                  }
                  className="w-full h-11 rounded-xl border border-border bg-background px-4"
                />

              </Field>

              <Field label="Prix au km">

                <input
                  type="number"
                  step={0.1}
                  value={location.travel_fee_per_km}
                  onChange={(e) =>
                    onChange({
                      travel_fee_per_km: Number(
                        e.target.value,
                      ),
                    })
                  }
                  className="w-full h-11 rounded-xl border border-border bg-background px-4"
                />

              </Field>

            </div>

          </div>

        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-6">

{/* Aperçu client */}

<div className="rounded-3xl border border-border bg-card p-6 shadow-soft">

  <div className="flex items-center gap-2 mb-5">

    <Eye className="w-5 h-5 text-primary" />

    <h3 className="font-semibold">
      Aperçu côté client
    </h3>

  </div>

  <div className="rounded-2xl border border-border bg-background p-5">

    <div className="flex items-center gap-4">

      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">

        {location.type === "home" ? (
          <Home className="w-6 h-6" />
        ) : location.type === "video" ? (
          <Monitor className="w-6 h-6" />
        ) : (
          <Building2 className="w-6 h-6" />
        )}

      </div>

      <div>

        <div className="font-semibold text-lg">

          {location.name}

        </div>

        <div className="text-sm text-muted-foreground">

          {location.city || "Ville non renseignée"}

        </div>

      </div>

    </div>

    <div className="mt-6 space-y-3">

      <InfoRow
        title="Zone d'intervention"
        value={`${location.travel_radius_km} km`}
      />

      <InfoRow
        title="Temps de trajet"
        value={`${location.travel_time_max_min} min`}
      />

      <InfoRow
        title="Déplacements"
        value={
          location.travel_fee_type === "free"
            ? "Gratuits"
            : location.travel_fee_type === "fixed"
            ? "Forfait"
            : `${location.travel_fee_per_km} €/km`
        }
      />

    </div>

    <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">

      <div className="font-semibold text-emerald-700">

        ✔ Visible sur Booker

      </div>

      <div className="text-sm text-emerald-600 mt-2">

        Les clients voient uniquement votre secteur
        d'activité. Votre adresse privée reste masquée.

      </div>

    </div>

  </div>

</div>

{/* IA */}

<div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6 shadow-soft">

  <div className="flex items-center gap-2 mb-4">

    <Sparkles className="w-5 h-5 text-primary" />

    <h3 className="font-semibold">

      IA Booker

    </h3>

  </div>

  <div className="space-y-4 text-sm">

    <div className="rounded-xl border border-border bg-card p-4">

      💡 Avec un rayon de

      <strong> {location.travel_radius_km} km</strong>

      vous pourrez toucher davantage de clients autour de

      <strong> {location.city || "votre secteur"}.</strong>

    </div>

    <div className="rounded-xl border border-border bg-card p-4">

      🚗 Votre temps maximum est de

      <strong> {location.travel_time_max_min} minutes.</strong>

    </div>

    <div className="rounded-xl border border-border bg-card p-4">

      📈 Plus tard, Booker vous proposera automatiquement
      les meilleurs secteurs où ouvrir des créneaux.

    </div>

  </div>

</div>

</div>

</div>

</section>

);

}

function InfoRow({

title,

value,

}: {

title: string;

value: ReactNode;

}) {

return (

<div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">

<div className="text-sm text-muted-foreground">

{title}

</div>

<div className="font-semibold">

{value}

</div>

</div>

);

}

function Field({

label,

children,

}: {

label: string;

children: ReactNode;

}) {

return (

<label className="block">

<div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">

{label}

</div>

{children}

</label>

);

}