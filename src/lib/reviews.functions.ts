import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createReviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reviews")
      .select("id, booking_id, pro_id, rating, comment, created_at, pros:pro_id(id, name, job, avatar_url)")
      .eq("client_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return data ?? [];
  });

export const listReviewableBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existingReviews, error: reviewsError } = await context.supabase
      .from("reviews")
      .select("booking_id")
      .eq("client_id", context.userId);

    if (reviewsError) throw new Error(reviewsError.message);

    const reviewedBookingIds = new Set(
      (existingReviews ?? [])
        .map((review) => review.booking_id)
        .filter((bookingId): bookingId is string => Boolean(bookingId)),
    );

    const { data: bookings, error } = await context.supabase
      .from("bookings")
      .select("id, pro_id, service_name, start_at, status, pros:pro_id(id, name, job, avatar_url)")
      .eq("client_id", context.userId)
      .eq("status", "completed")
      .order("start_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (bookings ?? []).filter((booking) => !reviewedBookingIds.has(booking.id));
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => createReviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: booking, error: bookingError } = await context.supabase
      .from("bookings")
      .select("id, pro_id, client_id, status")
      .eq("id", data.booking_id)
      .eq("client_id", context.userId)
      .eq("status", "completed")
      .maybeSingle();

    if (bookingError) throw new Error(bookingError.message);

    if (!booking) {
      throw new Error("Vous pouvez laisser un avis uniquement après une réservation terminée.");
    }

    const { data: existingReview, error: existingError } = await context.supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", data.booking_id)
      .eq("client_id", context.userId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existingReview) {
      throw new Error("Vous avez déjà laissé un avis pour cette réservation.");
    }

    const { data: review, error } = await context.supabase
      .from("reviews")
      .insert({
        booking_id: booking.id,
        client_id: context.userId,
        pro_id: booking.pro_id,
        rating: data.rating,
        comment: data.comment?.trim() || null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return review;
  });
