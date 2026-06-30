import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type BookingRow = {
  id: string;
  created_at: string;
  start_at: string;
  price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  pro_id: string;
  service_name: string;
  pros?: { id: string; name: string; category: string } | { id: string; name: string; category: string }[] | null;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function percentChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "+100%";

  const value = Math.round(((current - previous) / previous) * 100);
  return `${value >= 0 ? "+" : ""}${value}%`;
}

function getProCategory(booking: BookingRow) {
  const pro = Array.isArray(booking.pros) ? booking.pros[0] ?? null : booking.pros;
  return pro?.category || "Autre";
}

function getLeadTimeDays(bookings: BookingRow[]) {
  const values = bookings
    .map((booking) => {
      const created = new Date(booking.created_at).getTime();
      const start = new Date(booking.start_at).getTime();

      if (Number.isNaN(created) || Number.isNaN(start)) return null;

      return Math.max(0, Math.round((start - created) / 86_400_000));
    })
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getPreferredTimeWindow(bookings: BookingRow[]) {
  const buckets = [
    { label: "le matin", from: 6, to: 12, count: 0 },
    { label: "le midi", from: 12, to: 14, count: 0 },
    { label: "l’après-midi", from: 14, to: 18, count: 0 },
    { label: "le soir", from: 18, to: 23, count: 0 },
  ];

  for (const booking of bookings) {
    const hour = new Date(booking.start_at).getHours();
    const bucket = buckets.find((item) => hour >= item.from && hour < item.to);

    if (bucket) bucket.count += 1;
  }

  const best = buckets.sort((a, b) => b.count - a.count)[0];

  return best.count > 0 ? best.label : null;
}

export const getClientAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [
      { data: bookingsData, error: bookingsError },
      { data: favoritesData, error: favoritesError },
      { data: reviewsData, error: reviewsError },
      { data: conversationsData, error: conversationsError },
    ] = await Promise.all([
      context.supabase
        .from("bookings")
        .select("id, created_at, start_at, price, status, pro_id, service_name, pros:pro_id(id, name, category)")
        .eq("client_id", context.userId)
        .order("start_at", { ascending: true }),

      context.supabase
        .from("favorites")
        .select("pro_id")
        .eq("user_id", context.userId),

      context.supabase
        .from("reviews")
        .select("rating")
        .eq("client_id", context.userId),

      context.supabase
        .from("conversations")
        .select("id")
        .eq("client_id", context.userId),
    ]);

    if (bookingsError) throw new Error(bookingsError.message);
    if (favoritesError) throw new Error(favoritesError.message);
    if (reviewsError) throw new Error(reviewsError.message);
    if (conversationsError) throw new Error(conversationsError.message);

    const bookings = (bookingsData ?? []) as BookingRow[];
    const activeBookings = bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed");
    const completedBookings = bookings.filter((booking) => booking.status === "completed");
    const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled");
    const countedBookings = bookings.filter((booking) => booking.status !== "cancelled");

    const bookedAmount = countedBookings.reduce((sum, booking) => sum + Number(booking.price ?? 0), 0);
    const uniquePros = new Set(bookings.map((booking) => booking.pro_id)).size;

    const ratings = (reviewsData ?? []).map((review) => Number(review.rating)).filter((rating) => Number.isFinite(rating));
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : null;

    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      const key = monthKey(date);

      return {
        key,
        label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date),
        count: 0,
        spent: 0,
      };
    });

    const monthsByKey = new Map(months.map((month) => [month.key, month]));

    for (const booking of countedBookings) {
      const key = monthKey(new Date(booking.start_at));
      const month = monthsByKey.get(key);

      if (!month) continue;

      month.count += 1;
      month.spent += Number(booking.price ?? 0);
    }

    const currentMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const previousMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const currentMonth = monthsByKey.get(currentMonthKey);
    const previousMonth = monthsByKey.get(previousMonthKey);

    const categories = new Map<string, number>();

    for (const booking of countedBookings) {
      const category = getProCategory(booking);
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }

    const totalCategoryCount = Array.from(categories.values()).reduce((sum, value) => sum + value, 0);

    const categoryBreakdown = Array.from(categories.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: totalCategoryCount > 0 ? Math.round((count / totalCategoryCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const leadTimeDays = getLeadTimeDays(bookings);
    const preferredTimeWindow = getPreferredTimeWindow(bookings);
    const favoriteCategory = categoryBreakdown[0]?.label ?? null;

    const conversationIds = (conversationsData ?? []).map((conversation) => conversation.id);
    let messagesCount = 0;

    if (conversationIds.length > 0) {
      const { count, error: messagesError } = await context.supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds);

      if (messagesError) throw new Error(messagesError.message);

      messagesCount = count ?? 0;
    }

    const insights = [
      leadTimeDays !== null
        ? `Vous réservez en moyenne ${leadTimeDays} jour${leadTimeDays > 1 ? "s" : ""} à l’avance.`
        : "Vos habitudes de réservation apparaîtront après vos premiers rendez-vous.",
      preferredTimeWindow
        ? `Votre créneau préféré semble être ${preferredTimeWindow}.`
        : "Vos créneaux préférés seront calculés avec plus de réservations.",
      favoriteCategory
        ? `Votre catégorie la plus utilisée est ${favoriteCategory}.`
        : "Vos catégories préférées apparaîtront après vos premières réservations.",
    ];

    return {
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      bookedAmount,
      uniquePros,
      favoritesCount: favoritesData?.length ?? 0,
      reviewsCount: ratings.length,
      avgRating,
      messagesCount,
      monthlySeries: months,
      categoryBreakdown,
      insights,
      trends: {
        bookings: percentChange(currentMonth?.count ?? 0, previousMonth?.count ?? 0),
        bookedAmount: percentChange(currentMonth?.spent ?? 0, previousMonth?.spent ?? 0),
        uniquePros: uniquePros > 0 ? `+${uniquePros}` : "0",
        avgRating: ratings.length > 0 ? `${ratings.length} avis` : "",
      },
    };
  });
