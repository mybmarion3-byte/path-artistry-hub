import type { Mode } from "@/lib/booker-store";

// Profil du compte client mock (pré-rempli à l'inscription).
// Les champs vides servent encore au prototype pour déclencher les étapes obligatoires.
export const ACCOUNT_PROFILE = {
  firstName: "Marion",
  lastName: "Dubois",
  phone: "06 24 18 92 07",
  digicode: "",
  city: "Paris",
};

export const ACCOUNT_MAIN_ADDRESS = null;
export const HAS_MAIN_ADDRESS = !!ACCOUNT_MAIN_ADDRESS;
export const HAS_DIGICODE = ACCOUNT_PROFILE.digicode.trim().length > 0;

export const FAVORITE_ADDRESS_ID = "a2";
export const CURRENT_LOCATION_LABEL = "12 avenue de l'Opéra, 75001 Paris";

export const ADDRESS_SUGGESTIONS_DB = [
  "5 rue de la Paix, 75002 Paris",
  "12 avenue de l'Opéra, 75001 Paris",
  "8 boulevard Haussmann, 75009 Paris",
  "24 rue de Tocqueville, 75017 Paris",
  "45 rue du Faubourg Saint-Honoré, 75008 Paris",
  "3 place Vendôme, 75001 Paris",
  "17 rue Saint-Dominique, 75007 Paris",
  "228 rue de Rivoli, 75001 Paris",
  "9 rue Royale, 75008 Paris",
  "60 rue de Sèvres, 75007 Paris",
  "Tour First, 1 place des Saisons, 92800 Puteaux",
  "14 rue Cler, 75007 Paris",
];

export type StepKey =
  | "service"
  | "mode"
  | "address"
  | "business"
  | "collaborator"
  | "slot"
  | "info"
  | "pay";

export function buildSteps(mode: Mode, availableModes: Mode[] = []): StepKey[] {
  const includeMode = availableModes.length > 1;
  if (mode === "home") {
    return ["service", ...(includeMode ? ["mode" as StepKey] : []), "address", "slot", "info", "pay"];
  }
  if (mode === "studio") {
    return ["service", ...(includeMode ? ["mode" as StepKey] : []), "business", "collaborator", "slot", "info", "pay"];
  }
  return ["service", ...(includeMode ? ["mode" as StepKey] : []), "slot", "info", "pay"];
}

export function modeLabel(mode: Mode) {
  return mode === "home" ? "À domicile" : mode === "studio" ? "En établissement" : "En visio";
}
