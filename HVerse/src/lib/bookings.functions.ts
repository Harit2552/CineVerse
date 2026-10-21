import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { priceBreakdown } from "./cinema";

function bookingCode(): string {
  return `CV-${Math.floor(100000 + Math.random() * 899999)}`;
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { full_name: string; email: string; phone: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { showId: string; seats: string[]; paymentMethod: string }) => {
    if (!data.showId) throw new Error("Missing show");
    if (!Array.isArray(data.seats) || data.seats.length === 0) {
      throw new Error("Select at least one seat");
    }
    if (data.seats.length > 10) throw new Error("You can book at most 10 seats per booking");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: show, error: showError } = await supabase
      .from("shows")
      .select("id,base_price")
      .eq("id", data.showId)
      .maybeSingle();
    if (showError) throw new Error(showError.message);
    if (!show) throw new Error("This show is no longer available");

    const seats = Array.from(new Set(data.seats));
    const { data: taken, error: takenError } = await supabase
      .from("booking_seats")
      .select("seat_id")
      .eq("show_id", data.showId)
      .in("seat_id", seats);
    if (takenError) throw new Error(takenError.message);
    if ((taken ?? []).length > 0) {
      throw new Error(
        `Sorry, ${(taken ?? []).map((t) => t.seat_id).join(", ")} was just booked by someone else.`,
      );
    }

    const price = priceBreakdown(show.base_price, seats);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode(),
        user_id: userId,
        show_id: data.showId,
        seats,
        ticket_total: price.ticketTotal,
        convenience_fee: price.convenienceFee,
        taxes: price.taxes,
        total_amount: price.total,
        payment_method: data.paymentMethod,
        status: "confirmed",
      })
      .select("*")
      .single();
    if (bookingError) throw new Error(bookingError.message);

    const { error: seatError } = await supabase
      .from("booking_seats")
      .insert(seats.map((seat_id) => ({ show_id: data.showId, seat_id, booking_id: booking.id })));

    if (seatError) {
      await supabase.from("bookings").delete().eq("id", booking.id);
      throw new Error("Those seats were just taken. Please pick different seats.");
    }

    return { bookingId: booking.id as string, bookingCode: booking.booking_code as string };
  });

const BOOKING_SELECT =
  "id,booking_code,seats,ticket_total,convenience_fee,taxes,total_amount,payment_method,status,created_at,show:shows(id,show_date,show_time,base_price,screen:screens(name,format),movie:movies(id,title,poster_url,genre,duration_min,language,age_rating))";

export type BookingDetail = {
  id: string;
  booking_code: string;
  seats: string[];
  ticket_total: number;
  convenience_fee: number;
  taxes: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  show: {
    id: string;
    show_date: string;
    show_time: string;
    base_price: number;
    screen: { name: string; format: string };
    movie: {
      id: string;
      title: string;
      poster_url: string;
      genre: string;
      duration_min: number;
      language: string;
      age_rating: string;
    };
  };
};

export const getMyBooking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: booking, error } = await context.supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", data.bookingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (booking ?? null) as unknown as BookingDetail | null;
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as BookingDetail[];
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.bookingId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    const { error: seatError } = await context.supabase
      .from("booking_seats")
      .delete()
      .eq("booking_id", data.bookingId);
    if (seatError) throw new Error(seatError.message);

    return { ok: true };
  });
