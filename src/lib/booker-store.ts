import { create } from "zustand";
import camilleImg from "@/assets/pro-camille.jpg";
import thomasImg from "@/assets/pro-thomas.jpg";
import julieImg from "@/assets/pro-julie.jpg";
import nicolasImg from "@/assets/pro-nicolas.jpg";
import lauraImg from "@/assets/pro-laura.jpg";

export type Service = {
  id: string;
  name: string;
  duration: number; // minutes
  price: number; // €
};

export type Mode = "home" | "studio" | "video";

export type Pro = {
  id: string;
  name: string;
  job: string;
  avatar: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  availability: string; // "now" | "HH:MM"
  price: number; // starting price (mirror of cheapest service)
  bio: string;
  verified: boolean;
  atHome: boolean;
  specialty: string;
  experience: number; // years
  x: number;
  y: number;
  category: string;
  services: Service[];
  modes: Mode[];
};

export const PROS: Pro[] = [
  {
    id: "camille",
    name: "Camille Bernard",
    job: "Coiffeuse à domicile",
    avatar: camilleImg,
    rating: 4.9,
    reviews: 127,
    distanceKm: 0.8,
    availability: "now",
    price: 35,
    bio: "Plus de 8 ans d'expérience. Je me déplace chez vous avec tout le matériel nécessaire.",
    verified: true,
    atHome: true,
    specialty: "Spécialiste couleur & balayage",
    experience: 8,
    x: 52,
    y: 48,
    category: "Coiffure",
    services: [
      { id: "brushing", name: "Brushing", duration: 45, price: 35 },
      { id: "coupe", name: "Coupe + brushing", duration: 60, price: 55 },
      { id: "couleur", name: "Couleur", duration: 90, price: 80 },
      { id: "balayage", name: "Balayage", duration: 120, price: 120 },
    ],
    modes: ["home"],
  },
  {
    id: "thomas",
    name: "Thomas Martin",
    job: "Coach sportif",
    avatar: thomasImg,
    rating: 4.8,
    reviews: 98,
    distanceKm: 1.2,
    availability: "14:30",
    price: 60,
    bio: "Coach certifié, je vous accompagne pour atteindre vos objectifs fitness.",
    verified: true,
    atHome: true,
    specialty: "Préparation physique & remise en forme",
    experience: 6,
    x: 82,
    y: 22,
    category: "Sport",
    services: [
      { id: "seance", name: "Séance individuelle", duration: 60, price: 60 },
      { id: "duo", name: "Séance duo", duration: 60, price: 90 },
      { id: "programme", name: "Programme + suivi", duration: 90, price: 110 },
    ],
    modes: ["home", "video"],
  },
  {
    id: "julie",
    name: "Julie Lemoine",
    job: "Esthéticienne",
    avatar: julieImg,
    rating: 4.9,
    reviews: 63,
    distanceKm: 1.4,
    availability: "15:00",
    price: 35,
    bio: "Soins du visage, épilation, manucure. Tout pour vous chouchouter.",
    verified: true,
    atHome: true,
    specialty: "Soins visage & manucure",
    experience: 5,
    x: 78,
    y: 62,
    category: "Beauté",
    services: [
      { id: "manucure", name: "Manucure", duration: 45, price: 35 },
      { id: "soin-visage", name: "Soin du visage", duration: 60, price: 55 },
      { id: "epil", name: "Épilation jambes", duration: 45, price: 40 },
    ],
    modes: ["home"],
  },
  {
    id: "nicolas",
    name: "Nicolas Dupont",
    job: "Massage bien-être",
    avatar: nicolasImg,
    rating: 4.7,
    reviews: 86,
    distanceKm: 1.7,
    availability: "15:30",
    price: 70,
    bio: "Masseur diplômé. Détente garantie avec mes massages personnalisés.",
    verified: true,
    atHome: true,
    specialty: "Massage suédois & californien",
    experience: 10,
    x: 35,
    y: 26,
    category: "Bien-être",
    services: [
      { id: "suedois", name: "Massage suédois", duration: 60, price: 70 },
      { id: "californien", name: "Massage californien", duration: 75, price: 85 },
      { id: "pierres", name: "Pierres chaudes", duration: 90, price: 100 },
    ],
    modes: ["home", "studio"],
  },
  {
    id: "laura",
    name: "Laura Petit",
    job: "Maquilleuse",
    avatar: lauraImg,
    rating: 5.0,
    reviews: 45,
    distanceKm: 2.1,
    availability: "16:00",
    price: 65,
    bio: "Maquillage mariage, soirée, shooting. Je sublime votre beauté naturelle.",
    verified: true,
    atHome: true,
    specialty: "Maquillage événementiel",
    experience: 7,
    x: 25,
    y: 70,
    category: "Beauté",
    services: [
      { id: "jour", name: "Maquillage jour", duration: 45, price: 65 },
      { id: "soiree", name: "Maquillage soirée", duration: 60, price: 85 },
      { id: "mariee", name: "Maquillage mariée", duration: 90, price: 150 },
    ],
    modes: ["home", "studio"],
  },
];

/* -------------------- Establishments & client addresses -------------------- */

export type BusinessLocation = {
  id: string;
  name: string;
  emoji: string;
  gradient: string; // tailwind gradient classes for the placeholder photo
  address: string;
  distanceKm: number;
  nextSlot: string;
  proIds: string[];
};

export const BUSINESSES: BusinessLocation[] = [
  {
    id: "b1",
    name: "Salon Paris 17",
    emoji: "💇",
    gradient: "from-violet-400 via-fuchsia-400 to-rose-400",
    address: "12 rue de Lévis, 75017 Paris",
    distanceKm: 0.6,
    nextSlot: "Aujourd'hui 14:30",
    proIds: ["camille", "julie", "laura"],
  },
  {
    id: "b2",
    name: "Salon Boulogne",
    emoji: "✂️",
    gradient: "from-rose-400 via-orange-400 to-amber-400",
    address: "8 av. Edouard Vaillant, 92100 Boulogne",
    distanceKm: 3.4,
    nextSlot: "Aujourd'hui 16:00",
    proIds: ["camille", "nicolas"],
  },
  {
    id: "b3",
    name: "Coworking Opéra",
    emoji: "🏢",
    gradient: "from-sky-400 via-cyan-400 to-emerald-400",
    address: "15 rue Auber, 75009 Paris",
    distanceKm: 2.1,
    nextSlot: "Demain 09:00",
    proIds: ["thomas", "nicolas", "laura"],
  },
];

export function getBusinessesForPro(proId: string): BusinessLocation[] {
  return BUSINESSES.filter((b) => b.proIds.includes(proId));
}

export function getProsForBusiness(businessId: string): Pro[] {
  const biz = BUSINESSES.find((b) => b.id === businessId);
  if (!biz) return [];
  return biz.proIds.map((id) => getPro(id));
}

export type ClientAddress = {
  id: string;
  label: string;
  kind: "home" | "hotel" | "office" | "custom";
  address: string;
};

export const DEFAULT_ADDRESSES: ClientAddress[] = [
  { id: "a1", label: "Domicile", kind: "home", address: "24 rue de Tocqueville, 75017 Paris" },
  { id: "a2", label: "Hôtel Le Meurice", kind: "hotel", address: "228 rue de Rivoli, 75001 Paris" },
  { id: "a3", label: "Bureau La Défense", kind: "office", address: "Tour First, 92800 Puteaux" },
];


export type Booking = {
  id: string;
  proId: string;
  serviceId?: string;
  serviceName?: string;
  mode?: Mode;
  date: string;
  time: string;
  price: number;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: number;
  address?: string;
  businessName?: string;
  collaboratorName?: string;
  phone?: string;
  digicode?: string;
  comments?: string;
};

export type Message = {
  id: string;
  proId: string;
  text: string;
  from: "me" | "pro";
  at: number;
};

// Pro-side messages: conversations with clients
export type ProMessage = {
  id: string;
  clientId: string; // matches proClients.id
  text: string;
  from: "me" | "client"; // "me" = the pro
  at: number;
};

export type Review = {
  id: string;
  proId: string;
  rating: number;
  comment: string;
  at: number;
};

export type InstantRequest = {
  id: string;
  category: string;
  serviceName: string;
  location: string;
  when: string;
  budget: number;
  comment: string;
  status: "pending" | "matched" | "expired";
  matchedProId?: string;
  notifiedProIds: string[];
  createdAt: number;
};

export type When = { kind: "now" } | { kind: "today" } | { kind: "date"; iso: string };

export type Role = "client" | "pro";

export type ProRequest = {
  id: string;
  clientName: string;
  serviceName: string;
  location: string;
  distanceKm: number;
  when: string;
  price: number;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
};

export type AgendaSlot = {
  id: string;
  day: number; // 0..6
  hour: number; // 8..19, supports .5
  dur: number; // hours
  label: string;
  clientName: string;
  serviceName: string;
  price: number;
};

export type ProClient = {
  id: string;
  name: string;
  visits: number;
  lastService: string;
  spent: number;
  rating: number;
  note?: string;
  vip?: boolean;
};

export type ProSettings = {
  radiusKm: number;
  minBudget: number;
  autoAccept: boolean;
};

type State = {
  role: Role;
  proIdentityId: string;
  proVisible: boolean;
  selectedProId: string;
  favorites: string[];
  bookings: Booking[];
  messages: Message[];
  proMessages: ProMessage[];
  reviews: Review[];
  notifications: { id: string; title: string; body: string; at: number; read: boolean }[];
  requests: InstantRequest[];
  proInbox: ProRequest[];
  proServices: Service[];
  proAgenda: AgendaSlot[];
  proClients: ProClient[];
  proSettings: ProSettings;
  proInboxFilter: { maxKm: number; minBudget: number };
  revenuePeriod: "3m" | "6m" | "12m";
  filters: { categories: string[]; atHome: boolean; maxKm: number };
  view: "map" | "list" | "ai";
  searchQuery: string;
  location: string;
  when: When;
  setRole: (r: Role) => void;
  setProVisible: (v: boolean) => void;
  selectPro: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addBooking: (b: Omit<Booking, "id" | "createdAt" | "status">) => Booking;
  cancelBooking: (id: string) => void;
  sendMessage: (proId: string, text: string) => void;
  sendProMessage: (clientId: string, text: string) => void;
  addReview: (r: Omit<Review, "id" | "at">) => void;
  setView: (v: "map" | "list" | "ai") => void;
  setFilters: (f: Partial<State["filters"]>) => void;
  removeFilterCategory: (c: string) => void;
  clearFilters: () => void;
  toggleFilterCategory: (c: string) => void;
  markAllNotificationsRead: () => void;
  setSearchQuery: (q: string) => void;
  setLocation: (l: string) => void;
  setWhen: (w: When) => void;
  createRequest: (r: Omit<InstantRequest, "id" | "createdAt" | "status" | "notifiedProIds">) => InstantRequest;
  matchRequest: (id: string, proId: string) => void;
  pushNotification: (n: { title: string; body: string }) => void;
  acceptProRequest: (id: string) => void;
  declineProRequest: (id: string) => void;
  // pro CRUD
  addProService: (s: Omit<Service, "id">) => void;
  updateProService: (id: string, s: Partial<Service>) => void;
  deleteProService: (id: string) => void;
  addAgendaSlot: (s: Omit<AgendaSlot, "id">) => void;
  removeAgendaSlot: (id: string) => void;
  addProClient: (c: Omit<ProClient, "id">) => void;
  updateProClientNote: (id: string, note: string) => void;
  toggleProClientVip: (id: string) => void;
  setProSettings: (s: Partial<ProSettings>) => void;
  setProModes: (proId: string, modes: Mode[]) => void;
  setProInboxFilter: (f: Partial<State["proInboxFilter"]>) => void;
  setRevenuePeriod: (p: "3m" | "6m" | "12m") => void;
};

export const useBooker = create<State>((set) => ({
  role: "client",
  proIdentityId: "camille",
  proVisible: true,
  selectedProId: "camille",
  favorites: ["camille"],
  bookings: [],
  proInbox: [
    { id: "pr1", clientName: "Sophie L.", serviceName: "Brushing", location: "Paris 17e", distanceKm: 1.2, when: "Aujourd'hui 15h00", price: 45, status: "pending", createdAt: Date.now() - 300_000 },
    { id: "pr2", clientName: "Léa M.", serviceName: "Couleur", location: "Levallois", distanceKm: 2.4, when: "Aujourd'hui 17h00", price: 85, status: "pending", createdAt: Date.now() - 600_000 },
    { id: "pr3", clientName: "Inès B.", serviceName: "Coupe + brushing", location: "Clichy", distanceKm: 3.1, when: "Demain 10h00", price: 55, status: "pending", createdAt: Date.now() - 1200_000 },
  ],
  messages: [
    { id: "m1", proId: "camille", text: "Bonjour Marion ! Hâte de vous coiffer 😊", from: "pro", at: Date.now() - 3600_000 },
    { id: "m2", proId: "thomas", text: "Prêt pour votre séance ?", from: "pro", at: Date.now() - 7200_000 },
  ],
  proMessages: [
    { id: "pm1", clientId: "c1", text: "Bonjour Camille, on confirme samedi à 14h ?", from: "client", at: Date.now() - 1800_000 },
    { id: "pm2", clientId: "c1", text: "Oui parfait, à samedi 👋", from: "me", at: Date.now() - 1700_000 },
    { id: "pm3", clientId: "c2", text: "Merci pour le brushing, j'ai adoré !", from: "client", at: Date.now() - 86400_000 },
    { id: "pm4", clientId: "c3", text: "Vous avez un créneau jeudi ?", from: "client", at: Date.now() - 600_000 },
  ],
  reviews: [],
  notifications: [
    { id: "n1", title: "Camille a accepté votre demande", body: "Elle sera chez vous dans 12 min.", at: Date.now() - 600_000, read: false },
    { id: "n2", title: "Nouveau message de Thomas", body: "Prêt pour votre séance ?", at: Date.now() - 7200_000, read: false },
    { id: "n3", title: "Promotion -20%", body: "Sur votre premier massage bien-être.", at: Date.now() - 86400_000, read: false },
  ],
  requests: [],
  proServices: PROS.find((p) => p.id === "camille")!.services.map((s) => ({ ...s })),
  proAgenda: [
    { id: "ag1", day: 0, hour: 9, dur: 1, label: "Brushing · Sophie", clientName: "Sophie L.", serviceName: "Brushing", price: 45 },
    { id: "ag2", day: 0, hour: 14, dur: 1.5, label: "Couleur · Marion", clientName: "Marion D.", serviceName: "Couleur", price: 80 },
    { id: "ag3", day: 1, hour: 10, dur: 2, label: "Balayage · Léa", clientName: "Léa M.", serviceName: "Balayage", price: 120 },
    { id: "ag4", day: 2, hour: 11, dur: 1, label: "Coupe · Inès", clientName: "Inès B.", serviceName: "Coupe", price: 45 },
    { id: "ag5", day: 3, hour: 15, dur: 1, label: "Brushing · Anna", clientName: "Anna R.", serviceName: "Brushing", price: 45 },
    { id: "ag6", day: 4, hour: 9, dur: 2, label: "Couleur · Camille", clientName: "Camille T.", serviceName: "Couleur", price: 80 },
    { id: "ag7", day: 5, hour: 14, dur: 1, label: "Brushing · Sarah", clientName: "Sarah K.", serviceName: "Brushing", price: 45 },
  ],
  proClients: [
    { id: "c1", name: "Marion Durand", visits: 12, lastService: "Couleur", spent: 720, rating: 5, vip: true, note: "Préfère samedi matin. Allergique aux sulfates." },
    { id: "c2", name: "Sophie Laurent", visits: 8, lastService: "Brushing", spent: 360, rating: 5, vip: true },
    { id: "c3", name: "Anna Roux", visits: 5, lastService: "Coupe + brushing", spent: 275, rating: 4 },
    { id: "c4", name: "Léa Martin", visits: 3, lastService: "Balayage", spent: 360, rating: 5 },
    { id: "c5", name: "Inès Bernard", visits: 2, lastService: "Coupe", spent: 90, rating: 4 },
  ],
  proSettings: { radiusKm: 5, minBudget: 0, autoAccept: false },
  proInboxFilter: { maxKm: 10, minBudget: 0 },
  revenuePeriod: "6m",
  filters: { categories: [], atHome: false, maxKm: 5 },
  view: "map",
  searchQuery: "",
  location: "Paris 17e",
  when: { kind: "now" },
  selectPro: (id) => set({ selectedProId: id }),
  toggleFavorite: (id) =>
    set((s) => ({
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    })),
  addBooking: (b) => {
    const booking: Booking = {
      ...b,
      id: `bk_${Date.now()}`,
      createdAt: Date.now(),
      status: "upcoming",
    };
    set((s) => ({ bookings: [booking, ...s.bookings] }));
    return booking;
  },
  cancelBooking: (id) =>
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    })),
  sendMessage: (proId, text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `msg_${Date.now()}`, proId, text, from: "me", at: Date.now() },
      ],
    })),
  sendProMessage: (clientId, text) =>
    set((s) => ({
      proMessages: [
        ...s.proMessages,
        { id: `pmsg_${Date.now()}`, clientId, text, from: "me", at: Date.now() },
      ],
    })),
  addReview: (r) =>
    set((s) => ({
      reviews: [{ ...r, id: `rv_${Date.now()}`, at: Date.now() }, ...s.reviews],
    })),
  setView: (v) => set({ view: v }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  removeFilterCategory: (c) =>
    set((s) => ({
      filters: { ...s.filters, categories: s.filters.categories.filter((x) => x !== c) },
    })),
  toggleFilterCategory: (c) =>
    set((s) => ({
      filters: {
        ...s.filters,
        categories: s.filters.categories.includes(c)
          ? s.filters.categories.filter((x) => x !== c)
          : [...s.filters.categories, c],
      },
    })),
  clearFilters: () => set({ filters: { categories: [], atHome: false, maxKm: 10 } }),
  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLocation: (l) => set({ location: l }),
  setWhen: (w) => set({ when: w }),
  createRequest: (r) => {
    const req: InstantRequest = {
      ...r,
      id: `req_${Date.now()}`,
      createdAt: Date.now(),
      status: "pending",
      notifiedProIds: [],
    };
    set((s) => ({ requests: [req, ...s.requests] }));
    return req;
  },
  matchRequest: (id, proId) =>
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, status: "matched", matchedProId: proId } : r,
      ),
    })),
  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        { id: `n_${Date.now()}`, title: n.title, body: n.body, at: Date.now(), read: false },
        ...s.notifications,
      ],
    })),
  setRole: (r) => set({ role: r }),
  setProVisible: (v) => set({ proVisible: v }),
  acceptProRequest: (id) =>
    set((s) => ({
      proInbox: s.proInbox.map((r) => (r.id === id ? { ...r, status: "accepted" } : r)),
    })),
  declineProRequest: (id) =>
    set((s) => ({
      proInbox: s.proInbox.map((r) => (r.id === id ? { ...r, status: "declined" } : r)),
    })),
  addProService: (s) =>
    set((st) => ({ proServices: [...st.proServices, { ...s, id: `sv_${Date.now()}` }] })),
  updateProService: (id, patch) =>
    set((st) => ({ proServices: st.proServices.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  deleteProService: (id) =>
    set((st) => ({ proServices: st.proServices.filter((x) => x.id !== id) })),
  addAgendaSlot: (slot) =>
    set((st) => ({ proAgenda: [...st.proAgenda, { ...slot, id: `ag_${Date.now()}` }] })),
  removeAgendaSlot: (id) =>
    set((st) => ({ proAgenda: st.proAgenda.filter((x) => x.id !== id) })),
  addProClient: (c) =>
    set((st) => ({ proClients: [...st.proClients, { ...c, id: `c_${Date.now()}` }] })),
  updateProClientNote: (id, note) =>
    set((st) => ({ proClients: st.proClients.map((c) => (c.id === id ? { ...c, note } : c)) })),
  toggleProClientVip: (id) =>
    set((st) => ({ proClients: st.proClients.map((c) => (c.id === id ? { ...c, vip: !c.vip } : c)) })),
  setProSettings: (p) => set((st) => ({ proSettings: { ...st.proSettings, ...p } })),
  setProInboxFilter: (f) => set((st) => ({ proInboxFilter: { ...st.proInboxFilter, ...f } })),
  setRevenuePeriod: (p) => set({ revenuePeriod: p }),
}));

export function getPro(id: string): Pro {
  return PROS.find((p) => p.id === id) ?? PROS[0];
}

export const CATEGORIES = ["Coiffure", "Beauté", "Bien-être", "Sport"] as const;
