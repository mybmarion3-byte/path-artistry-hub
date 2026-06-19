import { create } from "zustand";
import camilleImg from "@/assets/pro-camille.jpg";
import thomasImg from "@/assets/pro-thomas.jpg";
import julieImg from "@/assets/pro-julie.jpg";
import nicolasImg from "@/assets/pro-nicolas.jpg";
import lauraImg from "@/assets/pro-laura.jpg";

export type Pro = {
  id: string;
  name: string;
  job: string;
  avatar: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  availability: string; // "now" | "HH:MM"
  price: number;
  bio: string;
  verified: boolean;
  atHome: boolean;
  specialty: string;
  // map position (percentage relative to map container)
  x: number;
  y: number;
  category: string;
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
    price: 45,
    bio: "Plus de 8 ans d'expérience. Je me déplace chez vous avec tout le matériel nécessaire.",
    verified: true,
    atHome: true,
    specialty: "Spécialiste couleur & balayage",
    x: 52,
    y: 48,
    category: "Coiffure",
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
    x: 82,
    y: 22,
    category: "Sport",
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
    price: 55,
    bio: "Soins du visage, épilation, manucure. Tout pour vous chouchouter.",
    verified: true,
    atHome: true,
    specialty: "Soins visage & manucure",
    x: 78,
    y: 62,
    category: "Beauté",
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
    x: 35,
    y: 26,
    category: "Bien-être",
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
    x: 25,
    y: 70,
    category: "Beauté",
  },
];

export type Booking = {
  id: string;
  proId: string;
  date: string; // ISO date
  time: string; // HH:MM
  price: number;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: number;
};

export type Message = {
  id: string;
  proId: string;
  text: string;
  from: "me" | "pro";
  at: number;
};

export type Review = {
  id: string;
  proId: string;
  rating: number;
  comment: string;
  at: number;
};

type State = {
  selectedProId: string;
  favorites: string[];
  bookings: Booking[];
  messages: Message[];
  reviews: Review[];
  notifications: { id: string; title: string; body: string; at: number; read: boolean }[];
  filters: { categories: string[]; atHome: boolean; maxKm: number };
  view: "map" | "list" | "ai";
  selectPro: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addBooking: (b: Omit<Booking, "id" | "createdAt" | "status">) => Booking;
  cancelBooking: (id: string) => void;
  sendMessage: (proId: string, text: string) => void;
  addReview: (r: Omit<Review, "id" | "at">) => void;
  setView: (v: "map" | "list" | "ai") => void;
  setFilters: (f: Partial<State["filters"]>) => void;
  removeFilterCategory: (c: string) => void;
  clearFilters: () => void;
  markAllNotificationsRead: () => void;
};

export const useBooker = create<State>((set) => ({
  selectedProId: "camille",
  favorites: ["camille"],
  bookings: [],
  messages: [
    { id: "m1", proId: "camille", text: "Bonjour Marion ! Hâte de vous coiffer 😊", from: "pro", at: Date.now() - 3600_000 },
    { id: "m2", proId: "thomas", text: "Prêt pour votre séance ?", from: "pro", at: Date.now() - 7200_000 },
  ],
  reviews: [],
  notifications: [
    { id: "n1", title: "Camille a accepté votre demande", body: "Elle sera chez vous dans 12 min.", at: Date.now() - 600_000, read: false },
    { id: "n2", title: "Nouveau message de Thomas", body: "Prêt pour votre séance ?", at: Date.now() - 7200_000, read: false },
    { id: "n3", title: "Promotion -20%", body: "Sur votre premier massage bien-être.", at: Date.now() - 86400_000, read: false },
  ],
  filters: { categories: ["Coiffure"], atHome: true, maxKm: 5 },
  view: "map",
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
  clearFilters: () => set({ filters: { categories: [], atHome: false, maxKm: 10 } }),
  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
}));

export function getPro(id: string): Pro {
  return PROS.find((p) => p.id === id) ?? PROS[0];
}
