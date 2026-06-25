import { PROS, type Pro, type When, type Mode } from "./booker-store";

export type MatchInput = {
  query: string;
  category?: string;
  when: When;
  maxKm: number;
  atHome: boolean;
  mode?: Mode;
};

export type MatchResult = {
  pro: Pro;
  score: number;
  statusLabel: string; // e.g. "Maintenant", "Dans 12 min", "14:30", "Demain 10:00"
  statusTone: "now" | "soon" | "today" | "later";
  nextSlots: { label: string; iso: string }[];
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// Generate 6-8 future slots for a pro based on their availability.
export function getNextSlots(pro: Pro, now = new Date()): { label: string; iso: string }[] {
  const slots: { label: string; iso: string }[] = [];
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

  // Determine starting time today
  let startMin: number;
  if (pro.availability === "now") {
    // Round up to next 30 min
    startMin = now.getHours() * 60 + now.getMinutes();
    startMin = Math.ceil((startMin + 15) / 30) * 30;
  } else {
    const [h, m] = pro.availability.split(":").map(Number);
    startMin = h * 60 + m;
  }

  // Add "Maintenant" first if available now
  if (pro.availability === "now") {
    slots.push({ label: "Maintenant", iso: `${todayStr}T${pad(now.getHours())}:${pad(now.getMinutes())}` });
  }

  // Today slots
  for (let i = 0; i < 4 && startMin + i * 60 < 21 * 60; i++) {
    const t = startMin + i * 60;
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push({ label: `${pad(h)}:${pad(m)}`, iso: `${todayStr}T${pad(h)}:${pad(m)}` });
  }

  // Tomorrow slots
  [9, 11, 14, 17].forEach((h) => {
    slots.push({ label: `Demain ${pad(h)}:00`, iso: `${tomorrowStr}T${pad(h)}:00` });
  });

  return slots.slice(0, 8);
}

function statusFor(pro: Pro, now = new Date()): { label: string; tone: MatchResult["statusTone"] } {
  if (pro.availability === "now") {
    const minutes = Math.max(8, Math.round(pro.distanceKm * 6 + 6));
    return { label: `Disponible dans ${minutes} min`, tone: "now" };
  }
  const [h, m] = pro.availability.split(":").map(Number);
  const slot = h * 60 + m;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (slot >= cur) {
    return { label: `Aujourd'hui à ${pro.availability}`, tone: "soon" };
  }
  return { label: `Demain à ${pro.availability}`, tone: "later" };
}

function searchScore(pro: Pro, q: string): number {
  if (!q) return 0;
  const needle = q.toLowerCase().trim();
  let s = 0;
  if (pro.category.toLowerCase().includes(needle)) s += 3;
  if (pro.job.toLowerCase().includes(needle)) s += 2;
  if (pro.specialty.toLowerCase().includes(needle)) s += 2;
  if (pro.name.toLowerCase().includes(needle)) s += 4;
  for (const sv of pro.services) {
    if (sv.name.toLowerCase().includes(needle)) s += 5;
  }
  return s;
}

export function matchPros(input: MatchInput, pros: Pro[] = PROS): MatchResult[] {
  const now = new Date();
  const results: MatchResult[] = [];

  for (const pro of pros) {
    if (pro.distanceKm > input.maxKm) continue;
    if (input.atHome && !pro.modes.includes("home")) continue;
    if (input.mode && !pro.modes.includes(input.mode)) continue;
    if (input.category && pro.category !== input.category) continue;

    const sc = searchScore(pro, input.query);
    if (input.query && sc === 0) continue;

    // When filter
    if (input.when.kind === "now" && pro.availability !== "now") {
      // still allow with a penalty; but if user asks "now", prefer now
    }

    const status = statusFor(pro, now);
    const availabilityScore =
      pro.availability === "now" ? 10 : status.tone === "soon" ? 6 : 2;
    const proximity = Math.max(0, 10 - pro.distanceKm * 2);
    const rating = pro.rating * 2;
    const whenBoost =
      input.when.kind === "now" && pro.availability === "now" ? 8 : 0;

    const score = sc + availabilityScore + proximity + rating + whenBoost;

    results.push({
      pro,
      score,
      statusLabel: status.label,
      statusTone: status.tone,
      nextSlots: getNextSlots(pro, now),
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

export function findEligibleProsForRequest(opts: {
  category?: string;
  budget: number;
  atHome: boolean;
}, pros: Pro[] = PROS): Pro[] {
  return pros.filter((p) => {
    if (opts.category && p.category !== opts.category) return false;
    if (opts.atHome && !p.modes.includes("home")) return false;
    if (p.price > opts.budget * 1.5) return false;
    return true;
  });
}
