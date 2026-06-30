import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  CreditCard,
  Home as HomeIcon,
  Hotel,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import {
  PROS,
  getPro,
  useBooker,
  BUSINESSES,
  getBusinessesForPro,
  getProsForBusiness,
  type Pro,
  type Mode,
  type Service,
  type BusinessLocation,
  type ClientAddress,
} from "@/lib/booker-store";
import {
  createAddress as createAddressFn,
  listMyAddresses as listMyAddressesFn,
} from "@/lib/addresses.functions";
import { createBooking as createBookingFn } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCOUNT_PROFILE,
  ADDRESS_SUGGESTIONS_DB,
  CURRENT_LOCATION_LABEL,
  HAS_DIGICODE,
  buildSteps,
  modeLabel,
} from "@/components/app/booking-dialog-model";
import { hashLocation, useBookerSlots } from "@/components/app/booking-hooks";
import { Row, Stepper } from "@/components/app/booking-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------- Booking Dialog (3 steps) -------------------- */

/* -------------------- Booking dialog (adaptive multi-step) -------------------- */

export function BookingDialog({
  state,
  onClose,
}: {
  state: { pro: Pro; service?: Service; slotIso?: string } | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const pushNotification = useBooker((s) => s.pushNotification);
  const createBookingServer = useServerFn(createBookingFn);
  const listMyAddressesServer = useServerFn(listMyAddressesFn);
  const createAddressServer = useServerFn(createAddressFn);
  const queryClient = useQueryClient();

  const [stepIdx, setStepIdx] = useState(0);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);
  const [slotIso, setSlotIso] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<Mode>("home");
  const [addressId, setAddressId] = useState<string | undefined>("custom");
  const [customAddress, setCustomAddress] = useState("");
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);
  const [collaboratorId, setCollaboratorId] = useState<string | "any">("any");
  const [phone, setPhone] = useState("");
  const [digicode, setDigicode] = useState("");
  const [comments, setComments] = useState("");
  const [localAddresses, setLocalAddresses] = useState<ClientAddress[]>([]);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;

    setStepIdx(0);
    setServiceId(state.service?.id ?? state.pro.services[0]?.id);
    setSlotIso(state.slotIso);

    const defaultMode: Mode = state.pro.modes.includes("home") ? "home" : state.pro.modes[0];

    setMode(defaultMode);
    setAddressId("custom");
    setCustomAddress("");
    setLocalAddresses([]);
    setIsCreatingAddress(false);
    setAddressesLoading(false);
    setAddressSaving(false);
    setAddressError(null);

    const bizForPro = getBusinessesForPro(state.pro.id);
    setBusinessId(bizForPro[0]?.id);
    setCollaboratorId("any");
    setPhone(ACCOUNT_PROFILE.phone);
    setDigicode(ACCOUNT_PROFILE.digicode);
    setComments("");
  }, [state]);

  useEffect(() => {
    if (!state) return;

    let cancelled = false;

    async function loadAddresses() {
      setAddressesLoading(true);
      setAddressError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          if (!cancelled) {
            setLocalAddresses([]);
            setAddressId("custom");
          }
          return;
        }

        const rows = await listMyAddressesServer();
        if (cancelled) return;

        const addresses = rows.map((row) => ({
          id: row.id,
          label: row.label,
          kind: row.kind,
          address: row.address,
        }));

        setLocalAddresses(addresses);
        setAddressId((current) => {
          if (current && current !== "custom" && addresses.some((a) => a.id === current)) {
            return current;
          }

          return addresses[0]?.id ?? "custom";
        });
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Impossible de charger vos adresses enregistrées.";
          setAddressError(message);
          setLocalAddresses([]);
          setAddressId("custom");
        }
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    }

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [listMyAddressesServer, state]);

  const sourcePro = state?.pro ?? null;

  const proForSlots = useMemo(() => {
    if (mode === "studio" && businessId && collaboratorId !== "any") {
      return getPro(collaboratorId);
    }

    return sourcePro ?? PROS[0];
  }, [mode, businessId, collaboratorId, sourcePro]);

  const slots = useBookerSlots(proForSlots.id);

  const steps = useMemo(() => buildSteps(mode, sourcePro?.modes ?? []), [mode, sourcePro?.modes]);

  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  if (!state || !sourcePro) return null;

  const pro = sourcePro;
  const service = pro.services.find((s) => s.id === serviceId) ?? pro.services[0];

  if (!service) {
    return null;
  }

  const slot = slots.find((s) => s.iso === slotIso) ?? slots[0];

  const selectedBusiness: BusinessLocation | undefined = businessId
    ? BUSINESSES.find((b) => b.id === businessId)
    : undefined;

  const selectedAddress: ClientAddress | undefined = addressId
    ? localAddresses.find((a) => a.id === addressId)
    : undefined;

  const finalAddress =
    mode === "home"
      ? ((addressId === "custom" ? customAddress : selectedAddress?.address) ?? "")
      : "";

  const collaboratorPro =
    mode === "studio" && collaboratorId !== "any" ? getPro(collaboratorId) : undefined;

  const distanceKm = (() => {
    if (mode !== "home") return selectedBusiness?.distanceKm ?? 0;

    const addrStr = addressId === "custom" ? customAddress : (selectedAddress?.address ?? "");

    if (!addrStr) return pro.distanceKm;

    const h = hashLocation(addrStr);
    const offset = (h % 50) / 10 - 0.8;

    return Math.max(0.4, pro.distanceKm + offset);
  })();

  const etaMin = Math.max(5, Math.round(distanceKm * 6 + 6));
  const serviceFee = Math.round(service.price * 0.05);
  const total = service.price + serviceFee;

  const canContinue = (() => {
    switch (currentStep) {
      case "service":
        return !!serviceId;
      case "mode":
        return !!mode && pro.modes.includes(mode);
      case "address":
        return (
          mode !== "home" ||
          (addressId === "custom" ? customAddress.trim().length > 3 : !!addressId)
        );
      case "business":
        return !!businessId;
      case "collaborator":
        return !!collaboratorId;
      case "slot":
        return !!slotIso;
      case "info":
        return phone.trim().length >= 6;
      default:
        return true;
    }
  })();

  async function confirm() {
    const bookedPro = collaboratorPro ?? pro;

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      toast.error("Connectez-vous pour réserver", {
        description: "Vous serez redirigée vers la page de connexion.",
      });

      navigate({ to: "/auth", search: { redirect: "/" } });
      return;
    }

    if (!slot?.iso) {
      toast.error("Créneau invalide");
      return;
    }

    const startAt = new Date(slot.iso).toISOString();

    const addressText =
      mode === "home" ? finalAddress : mode === "studio" ? selectedBusiness?.address : undefined;
    const bookingAddressId =
      mode === "home" && addressId && addressId !== "custom" ? addressId : undefined;

    try {
      await createBookingServer({
        data: {
          pro_slug: (bookedPro as any).slug ?? bookedPro.id,
          service_slug: (service as any).slug ?? service.id,
          address_id: bookingAddressId,
          address_text: addressText,
          mode,
          start_at: startAt,
          duration_min: service.duration,
          phone,
          digicode: mode === "home" ? digicode : undefined,
          comments,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });

      pushNotification({
        title: `Demande envoyée à ${bookedPro.name.split(" ")[0]}`,
        body: `${service.name} — ${slot?.label}${
          mode === "studio" && selectedBusiness ? ` · ${selectedBusiness.name}` : ""
        }`,
      });

      toast.success("Demande de réservation envoyée !", {
        description: `${bookedPro.name.split(" ")[0]} — ${service.name} · ${slot?.label}`,
      });

      onClose();
      navigate({ to: "/reservations" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de réservation");
    }
  }

  const businessesForPro = getBusinessesForPro(pro.id);
  const collaboratorsForBusiness = businessId ? getProsForBusiness(businessId) : [];

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-soft px-6 py-5 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img src={pro.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div>
                <div>Réserver avec {pro.name.split(" ")[0]}</div>
                <div className="text-xs font-normal text-muted-foreground">{pro.job}</div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Tunnel de réservation adaptatif — étape {stepIdx + 1} sur {steps.length}
            </DialogDescription>
          </DialogHeader>
          <Stepper step={stepIdx + 1} total={steps.length} />
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentStep === "service" && (
            <StepService services={pro.services} serviceId={serviceId} onSelect={setServiceId} />
          )}

          {currentStep === "mode" && (
            <StepMode
              available={pro.modes}
              mode={mode}
              hasEstablishment={businessesForPro.length > 0}
              onPick={setMode}
            />
          )}

          {currentStep === "address" && (
            <StepAddress
              addresses={localAddresses}
              addressId={addressId}
              customAddress={customAddress}
              onSelect={setAddressId}
              onCustomChange={setCustomAddress}
              distanceKm={distanceKm}
              etaMin={etaMin}
              isCreatingAddress={isCreatingAddress}
              loading={addressesLoading}
              error={addressError}
              saving={addressSaving}
              onStartCreate={() => setIsCreatingAddress(true)}
              onCancelCreate={() => setIsCreatingAddress(false)}
              onSaveCreate={async (label, address, kind) => {
                setAddressSaving(true);
                setAddressError(null);

                try {
                  const row = await createAddressServer({
                    data: {
                      label,
                      address,
                      kind,
                      is_primary: localAddresses.length === 0,
                    },
                  });
                  const newAddr: ClientAddress = {
                    id: row.id,
                    label: row.label,
                    address: row.address,
                    kind: row.kind,
                  };

                  setLocalAddresses((prev) => [...prev, newAddr]);
                  setAddressId(newAddr.id);
                  setCustomAddress("");
                  setIsCreatingAddress(false);
                  toast.success("Adresse enregistrée !");
                } catch (e) {
                  const message =
                    e instanceof Error ? e.message : "Impossible d'enregistrer cette adresse.";
                  setAddressError(message);
                  toast.error(message);
                } finally {
                  setAddressSaving(false);
                }
              }}
            />
          )}

          {currentStep === "business" && (
            <StepBusiness
              list={businessesForPro.length > 0 ? businessesForPro : BUSINESSES}
              selectedId={businessId}
              onSelect={(id) => {
                setBusinessId(id);
                setCollaboratorId("any");
              }}
            />
          )}

          {currentStep === "collaborator" && (
            <StepCollaborator
              pros={collaboratorsForBusiness}
              selectedId={collaboratorId}
              onSelect={setCollaboratorId}
            />
          )}

          {currentStep === "slot" && (
            <StepSlot
              slots={slots}
              slotIso={slotIso}
              onSelect={setSlotIso}
              hint={
                mode === "studio" && selectedBusiness
                  ? `Agenda de ${selectedBusiness.name}`
                  : mode === "video"
                    ? "Créneaux visio disponibles"
                    : "Prochains créneaux du pro"
              }
            />
          )}

          {currentStep === "info" && (
            <StepInfo
              mode={mode}
              phone={phone}
              digicode={digicode}
              comments={comments}
              onPhone={setPhone}
              onDigicode={setDigicode}
              onComments={setComments}
            />
          )}

          {currentStep === "pay" && (
            <StepPay
              mode={mode}
              pro={collaboratorPro ?? pro}
              service={service}
              slotLabel={slot?.label ?? "—"}
              address={mode === "home" ? finalAddress : undefined}
              business={mode === "studio" ? selectedBusiness : undefined}
              etaMin={mode === "home" ? etaMin : undefined}
              serviceFee={serviceFee}
              total={total}
            />
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-between gap-2">
          {stepIdx > 0 ? (
            <button
              onClick={() => setStepIdx(stepIdx - 1)}
              className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary"
            >
              Retour
            </button>
          ) : (
            <span />
          )}

          {!isLast ? (
            <button
              onClick={() => setStepIdx(stepIdx + 1)}
              disabled={!canContinue}
              className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={confirm}
              className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Payer {total} €
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Step components -------------------- */

function StepService({
  services,
  serviceId,
  onSelect,
}: {
  services: Service[];
  serviceId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Choisir la prestation</div>

      <div className="space-y-2">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex justify-between items-center p-3 rounded-2xl border text-left transition ${
              serviceId === s.id
                ? "border-primary bg-accent/40"
                : "border-border hover:bg-secondary"
            }`}
          >
            <div>
              <div className="font-medium text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.duration} min</div>
            </div>

            <div className="font-semibold">{s.price} €</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepMode({
  available,
  mode,
  hasEstablishment,
  onPick,
}: {
  available: Mode[];
  mode: Mode;
  hasEstablishment: boolean;
  onPick: (m: Mode) => void;
}) {
  const allOptions: { m: Mode; emoji: string; label: string; sub: string }[] = [
    { m: "home", emoji: "🏠", label: "À domicile", sub: "Le pro vient chez vous" },
    { m: "studio", emoji: "🏢", label: "En établissement", sub: "Vous vous déplacez" },
    { m: "video", emoji: "💻", label: "En visio", sub: "Sans déplacement" },
  ];
  const options = allOptions.filter((o) =>
    o.m === "studio" ? hasEstablishment && available.includes("studio") : available.includes(o.m),
  );
  return (
    <div>
      <div className="text-sm font-semibold mb-1">Comment souhaitez-vous être reçu&nbsp;?</div>
      <div className="text-xs text-muted-foreground mb-3">
        {options.length === 1
          ? "Ce professionnel propose uniquement ce mode."
          : "Une question, un parcours sur mesure."}
      </div>
      <div className="space-y-2">
        {options.map((o) => {
          const active = mode === o.m;
          return (
            <button
              key={o.m}
              onClick={() => onPick(o.m)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition ${
                active
                  ? "border-primary bg-accent/40 shadow-soft"
                  : "border-border hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              <span className="text-2xl leading-none">{o.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.sub}</div>
              </div>
              {active && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepAddress({
  addresses,
  addressId,
  customAddress,
  onSelect,
  onCustomChange,
  distanceKm,
  etaMin,
  isCreatingAddress,
  loading,
  error,
  saving,
  onStartCreate,
  onCancelCreate,
  onSaveCreate,
}: {
  addresses: ClientAddress[];
  addressId?: string;
  customAddress: string;
  onSelect: (id: string) => void;
  onCustomChange: (v: string) => void;
  distanceKm: number;
  etaMin: number;
  isCreatingAddress: boolean;
  loading: boolean;
  error: string | null;
  saving: boolean;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onSaveCreate: (label: string, address: string, kind: ClientAddress["kind"]) => Promise<void>;
}) {
  const iconFor = (k: ClientAddress["kind"]) =>
    k === "home" ? HomeIcon : k === "hotel" ? Hotel : k === "office" ? Briefcase : MapPin;
  const customRef = useRef<HTMLInputElement>(null);

  // Pré-remplissage intelligent depuis le compte client
  const suggestedLabel = `Chez ${ACCOUNT_PROFILE.firstName}`;
  const favoriteAddress = addresses[0];

  const [newLabel, setNewLabel] = useState(suggestedLabel);
  const [newAddress, setNewAddress] = useState("");
  const [newKind, setNewKind] = useState<ClientAddress["kind"]>("home");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoInfo, setGeoInfo] = useState<{
    accuracyM: number;
    zone: string;
    tier: "high" | "medium" | "low" | "very-low";
  } | null>(null);

  useEffect(() => {
    if (addressId === "custom") customRef.current?.focus();
  }, [addressId]);

  // Reset les valeurs pré-remplies à chaque ouverture du formulaire
  useEffect(() => {
    if (isCreatingAddress) {
      setNewLabel(suggestedLabel);
      setNewAddress("");
      setNewKind("home");
      setSuggestions([]);
      setShowSuggestions(false);
      setGeoInfo(null);
    }
  }, [isCreatingAddress, suggestedLabel]);

  // Autocomplétion temps réel (filtrage local)
  useEffect(() => {
    const q = newAddress.trim().toLowerCase();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const matched = ADDRESS_SUGGESTIONS_DB.filter((s) => s.toLowerCase().includes(q)).slice(0, 5);
    setSuggestions(matched);
  }, [newAddress]);

  async function reverseGeocodeRaw(lat: number, lon: number): Promise<any | null> {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`,
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  function formatAddressForTier(data: any, tier: "high" | "medium" | "low" | "very-low"): string {
    const street = [data?.streetNumber, data?.streetName].filter(Boolean).join(" ");
    const locality = data?.locality || data?.city || "";
    const postcode = data?.postcode || "";
    const region = data?.principalSubdivision || "";
    const cityLine = [postcode, locality].filter(Boolean).join(" ");

    if (tier === "high" && street) {
      return [street, cityLine].filter(Boolean).join(", ");
    }
    if (tier === "medium") {
      // Rue connue mais sans n° fiable → on garde rue + ville
      const streetName = data?.streetName || "";
      return [streetName, cityLine].filter(Boolean).join(", ") || cityLine;
    }
    if (tier === "low") {
      return cityLine || locality;
    }
    // very-low → région / ville large
    return [locality, region].filter(Boolean).join(", ") || region;
  }

  function tierForAccuracy(acc: number): "high" | "medium" | "low" | "very-low" {
    if (acc <= 50) return "high";
    if (acc <= 500) return "medium";
    if (acc <= 2000) return "low";
    return "very-low";
  }

  function zoneLabelForTier(tier: "high" | "medium" | "low" | "very-low"): string {
    return tier === "high"
      ? "Adresse exacte"
      : tier === "medium"
        ? "Rue / quartier"
        : tier === "low"
          ? "Code postal / ville"
          : "Zone large";
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Géolocalisation indisponible", {
        description:
          "Votre navigateur ne supporte pas la localisation. Adresse par défaut utilisée.",
      });
      setNewAddress(CURRENT_LOCATION_LABEL);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const acc = Math.max(1, Math.round(accuracy));
        const tier = tierForAccuracy(acc);
        const data = await reverseGeocodeRaw(latitude, longitude);

        let filled = "";
        if (data) {
          filled = formatAddressForTier(data, tier);
        }

        if (!filled) {
          filled = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          toast.warning("Adresse non identifiée", {
            description: "Coordonnées utilisées — vous pouvez les ajuster manuellement.",
          });
        } else {
          const zone = zoneLabelForTier(tier);
          if (tier === "high") {
            toast.success("Adresse précise détectée", { description: `± ${acc} m — ${zone}` });
          } else {
            toast.warning("Position approximative", {
              description: `± ${acc} m — ${zone}. Complétez les détails manquants.`,
            });
          }
        }

        setNewAddress(filled);
        setGeoInfo({
          accuracyM: acc,
          zone: zoneLabelForTier(tier),
          tier,
        });
        setLocating(false);
        setShowSuggestions(false);
      },
      (err) => {
        setLocating(false);
        setGeoInfo(null);
        let title = "Localisation impossible";
        let description = "Saisissez votre adresse manuellement.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            title = "Accès à la position refusé";
            description =
              "Autorisez la géolocalisation dans votre navigateur, ou saisissez l'adresse à la main.";
            break;
          case err.POSITION_UNAVAILABLE:
            title = "Position indisponible";
            description =
              "Impossible d'obtenir votre position actuelle. Adresse de référence proposée.";
            setNewAddress(CURRENT_LOCATION_LABEL);
            break;
          case err.TIMEOUT:
            title = "Délai dépassé";
            description = "La localisation a pris trop de temps. Réessayez ou saisissez l'adresse.";
            break;
        }
        toast.error(title, { description });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  }

  function applySavedAddress(a: ClientAddress) {
    setNewAddress(a.address);
    setNewKind(a.kind);
    setNewLabel(a.label);
    setShowSuggestions(false);
  }

  if (isCreatingAddress) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Créer une adresse principale</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Pré-rempli depuis votre compte — complétez les champs manquants.
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelCreate}
            className="text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            Annuler
          </button>
        </div>

        {/* Raccourcis intelligents */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition disabled:opacity-60"
          >
            {locating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
            {locating ? "Localisation…" : "📍 Ma position actuelle"}
          </button>
          {favoriteAddress && (
            <button
              type="button"
              onClick={() => applySavedAddress(favoriteAddress)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold transition"
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Favorite · {favoriteAddress.label}
            </button>
          )}
        </div>

        {/* Adresses enregistrées */}
        {addresses.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              🏠 Mes adresses enregistrées
            </div>
            <div className="flex flex-wrap gap-1.5">
              {addresses.map((a) => {
                const Icon = iconFor(a.kind);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applySavedAddress(a)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-medium transition max-w-full"
                    title={a.address}
                  >
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate max-w-[160px]">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Type d'adresse
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["home", "office", "hotel", "custom"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setNewKind(k)}
                  className={`py-2 px-1 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition ${
                    newKind === k
                      ? "border-primary bg-accent/40 text-primary animate-scale-up"
                      : "border-border hover:bg-secondary bg-card"
                  }`}
                >
                  {k === "home" ? (
                    <HomeIcon className="w-3.5 h-3.5" />
                  ) : k === "office" ? (
                    <Briefcase className="w-3.5 h-3.5" />
                  ) : k === "hotel" ? (
                    <Hotel className="w-3.5 h-3.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {k === "home"
                      ? "Domicile"
                      : k === "office"
                        ? "Bureau"
                        : k === "hotel"
                          ? "Hôtel"
                          : "Autre"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1 flex items-center gap-1.5">
              Nom de l'adresse
              {newLabel === suggestedLabel && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5" /> Pré-rempli
                </span>
              )}
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex : Appartement principal"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="relative">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Adresse complète
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={newAddress}
                onChange={(e) => {
                  setNewAddress(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={`Rechercher une adresse à ${ACCOUNT_PROFILE.city}…`}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNewAddress(s);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center gap-2 border-b border-border last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Autocomplétion temps réel
            </div>

            {geoInfo && (
              <div
                className={`mt-2 rounded-xl border p-2.5 flex items-start gap-2 text-xs ${
                  geoInfo.tier === "high"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : geoInfo.tier === "medium"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-orange-50 border-orange-200 text-orange-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                    Précision GPS · ± {geoInfo.accuracyM} m
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-white/60 px-1.5 py-0.5 rounded-full">
                      {geoInfo.tier === "high"
                        ? "Fiable"
                        : geoInfo.tier === "medium"
                          ? "Moyenne"
                          : geoInfo.tier === "low"
                            ? "Approximative"
                            : "Très large"}
                    </span>
                  </div>
                  <div className="opacity-80 mt-0.5">
                    Zone : <strong>{geoInfo.zone}</strong>
                    {geoInfo.tier !== "high" && " — complétez le numéro et la rue à la main."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelCreate}
            className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
          >
            Retour au tunnel
          </button>
          <button
            type="button"
            disabled={saving || !newLabel.trim() || !newAddress.trim()}
            onClick={() => {
              void onSaveCreate(newLabel.trim(), newAddress.trim(), newKind);
            }}
            className="flex-[2] bg-gradient-primary text-primary-foreground rounded-xl py-2 text-sm font-semibold shadow-glow disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Valider et revenir"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm font-semibold mb-2">Où le pro doit-il venir&nbsp;?</div>
      {loading && (
        <div className="mb-3 rounded-2xl bg-secondary/50 border border-border p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Chargement de vos adresses enregistrées...
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {!loading && addresses.length === 0 && (
        <div className="mb-3 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>Aucune adresse principale enregistrée.</strong> Ajoutez-en une via le bouton
            ci-dessous — elle sera mémorisée pour vos prochaines réservations.
          </span>
        </div>
      )}
      <div className="space-y-2">
        {addresses.map((a) => {
          const Icon = iconFor(a.kind);
          const active = addressId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
                active ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="text-xs text-muted-foreground truncate">{a.address}</div>
              </div>
              {active && <Check className="w-4 h-4 text-primary mt-1" />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onStartCreate}
          className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-border hover:border-primary hover:bg-secondary text-left transition"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Ajouter une nouvelle adresse</div>
            <div className="text-[11px] text-muted-foreground">
              Géolocalisation, favoris et autocomplétion
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {addressId &&
        addressId !== "custom" &&
        (() => {
          const minRange = Math.max(5, Math.round(etaMin - Math.max(2, etaMin * 0.15)));
          const maxRange = Math.round(etaMin + Math.max(3, etaMin * 0.25));
          return (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-800 dark:text-emerald-300 space-y-3 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">
                    Temps d'arrivée estimé
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight">{etaMin} min</span>
                    <span className="text-xs opacity-80">(± {distanceKm.toFixed(1)} km)</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Zone couverte
                </span>
              </div>

              <div className="h-[2px] bg-emerald-500/10 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-emerald-500 w-[65%] rounded-full animate-pulse" />
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="flex items-center gap-1.5 opacity-90">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Plage estimée :{" "}
                  <strong className="font-semibold">
                    {minRange} à {maxRange} min
                  </strong>
                </span>
                <span className="opacity-75 text-[11px]">Trajet optimal</span>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

function StepBusiness({
  list,
  selectedId,
  onSelect,
}: {
  list: BusinessLocation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Choisir l'établissement</div>
      <div className="space-y-2">
        {list.map((b) => {
          const active = selectedId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                active ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${b.gradient} flex items-center justify-center text-2xl shrink-0`}
              >
                {b.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{b.name}</div>
                <div className="text-xs text-muted-foreground truncate">{b.address}</div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {b.distanceKm} km
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Clock className="w-3 h-3" /> {b.nextSlot}
                  </span>
                </div>
              </div>
              {active && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepCollaborator({
  pros,
  selectedId,
  onSelect,
}: {
  pros: Pro[];
  selectedId: string | "any";
  onSelect: (id: string | "any") => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">Choisir un collaborateur</div>
      <button
        onClick={() => onSelect("any")}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left mb-2 transition ${
          selectedId === "any" ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Peu importe</div>
          <div className="text-xs text-muted-foreground">Premier disponible · gain de temps</div>
        </div>
        {selectedId === "any" && <Check className="w-4 h-4 text-primary" />}
      </button>
      <div className="space-y-2">
        {pros.map((p) => {
          const active = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                active ? "border-primary bg-accent/40" : "border-border hover:bg-secondary"
              }`}
            >
              <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground truncate">{p.specialty}</div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-warning text-warning" /> {p.rating.toFixed(1)}
                  </span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {p.availability === "now" ? "Maintenant" : p.availability}
                  </span>
                </div>
              </div>
              {active && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepSlot({
  slots,
  slotIso,
  onSelect,
  hint,
}: {
  slots: { iso: string; label: string }[];
  slotIso?: string;
  onSelect: (iso: string) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-1">Choisir un créneau</div>
      <div className="text-xs text-muted-foreground mb-3">{hint}</div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((s) => {
          const active = slotIso === s.iso;
          const now = s.label === "Maintenant";
          return (
            <button
              key={s.iso}
              onClick={() => onSelect(s.iso)}
              className={`py-2.5 rounded-2xl text-xs font-semibold border transition ${
                active
                  ? now
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]"
                    : "border-primary bg-accent text-primary"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {now ? (
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  Maintenant
                </span>
              ) : (
                s.label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepInfo({
  mode,
  phone,
  digicode,
  comments,
  onPhone,
  onDigicode,
  onComments,
}: {
  mode: Mode;
  phone: string;
  digicode: string;
  comments: string;
  onPhone: (v: string) => void;
  onDigicode: (v: string) => void;
  onComments: (v: string) => void;
}) {
  const digicodeRef = useRef<HTMLInputElement>(null);
  const phoneMissing = !ACCOUNT_PROFILE.phone;
  const digicodeMissing = mode === "home" && !HAS_DIGICODE;
  const anyMissing = phoneMissing || digicodeMissing;

  useEffect(() => {
    // Bascule automatique sur le premier champ à compléter
    if (digicodeMissing && !digicode) digicodeRef.current?.focus();
  }, [digicodeMissing, digicode]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Informations complémentaires</div>
        {anyMissing ? (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> À compléter
          </span>
        ) : (
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1">
            <Check className="w-3 h-3" /> Pré-rempli depuis votre compte
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        {anyMissing
          ? `Bonjour ${ACCOUNT_PROFILE.firstName}, il manque quelques infos pour ce rendez-vous.`
          : `Bonjour ${ACCOUNT_PROFILE.firstName}, vérifiez ou modifiez si besoin.`}
      </p>
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
          <Phone className="w-3.5 h-3.5" /> Téléphone
        </span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          placeholder="06 12 34 56 78"
          className="w-full h-11 px-4 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary"
        />
      </label>
      {mode === "home" && (
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5" /> Digicode{" "}
            {digicodeMissing && !digicode ? (
              <span className="text-amber-700">· à renseigner</span>
            ) : (
              "(optionnel)"
            )}
          </span>
          <input
            ref={digicodeRef}
            value={digicode}
            onChange={(e) => onDigicode(e.target.value)}
            placeholder="Ex : 1234A · 3e étage gauche"
            className={`w-full h-11 px-4 rounded-xl border bg-secondary text-sm outline-none focus:border-primary ${
              digicodeMissing && !digicode
                ? "border-amber-300 ring-2 ring-amber-100"
                : "border-border"
            }`}
          />
        </label>
      )}
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
          <MessageSquare className="w-3.5 h-3.5" /> Commentaires (optionnel)
        </span>
        <textarea
          value={comments}
          onChange={(e) => onComments(e.target.value)}
          rows={3}
          placeholder="Précisions pour le professionnel…"
          className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-sm outline-none focus:border-primary resize-none"
        />
      </label>
    </div>
  );
}

function StepPay({
  mode,
  pro,
  service,
  slotLabel,
  address,
  business,
  etaMin,
  serviceFee,
  total,
}: {
  mode: Mode;
  pro: Pro;
  service: Service;
  slotLabel: string;
  address?: string;
  business?: BusinessLocation;
  etaMin?: number;
  serviceFee: number;
  total: number;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-3">Récapitulatif & paiement</div>
      <div className="rounded-2xl border border-border divide-y divide-border text-sm overflow-hidden">
        {mode === "studio" && business && <Row label="Établissement" value={business.name} />}
        {mode === "studio" && <Row label="Collaborateur" value={pro.name} />}
        {mode !== "studio" && <Row label="Professionnel" value={pro.name} />}
        <Row label="Prestation" value={`${service.name} (${service.duration} min)`} />
        {mode === "home" && address && <Row label="Adresse" value={address} />}
        <Row label="Créneau" value={slotLabel} />
        {mode === "home" && etaMin !== undefined && (
          <Row label="Temps d'arrivée" value={`~${etaMin} min`} />
        )}
        <Row label="Mode" value={modeLabel(mode)} />
        <Row label="Prix prestation" value={`${service.price} €`} />
        <Row label="Frais de service" value={`${serviceFee} €`} />
        <Row label="Total" value={`${total} €`} bold />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="w-3.5 h-3.5" />
        Paiement sécurisé · Annulation gratuite jusqu'à 4 h avant.
      </div>
    </div>
  );
}
