import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TOTAL_SEATS } from "./cinema";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin access required");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    return { isAdmin: Boolean(data), adminExists: (count ?? 0) > 0 };
  });

/** Bootstrap: the first signed-in person can claim admin while no admin exists. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) throw new Error("An admin already exists for this theater");

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = context.supabase;
    const today = new Date().toISOString().slice(0, 10);

    const [bookings, movies, screens, shows] = await Promise.all([
      db
        .from("bookings")
        .select(
          "id,booking_code,seats,total_amount,status,created_at,payment_method,user_id,show:shows(show_date,show_time,screen:screens(name),movie:movies(title))",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("movies").select("*").order("title"),
      db.from("screens").select("*").order("name"),
      db
        .from("shows")
        .select("id,show_date,show_time,base_price,screen:screens(id,name),movie:movies(id,title)")
        .gte("show_date", today)
        .order("show_date")
        .order("show_time")
        .limit(60),
    ]);

    if (bookings.error) throw new Error(bookings.error.message);

    const rows = (bookings.data ?? []) as any[];
    const confirmed = rows.filter((b) => b.status === "confirmed");
    const todays = confirmed.filter((b) => b.show?.show_date === today);
    const ticketsSold = confirmed.reduce((n, b) => n + (b.seats?.length ?? 0), 0);
    const todayShows = ((shows.data ?? []) as any[]).filter((s) => s.show_date === today);
    const todaySeats = todays.reduce((n, b) => n + (b.seats?.length ?? 0), 0);
    const capacity = Math.max(todayShows.length, 1) * TOTAL_SEATS;

    return {
      stats: {
        totalBookings: confirmed.length,
        todayRevenue: todays.reduce((n, b) => n + b.total_amount, 0),
        ticketsSold,
        occupancy: Math.round((todaySeats / capacity) * 100),
        upcomingShows: ((shows.data ?? []) as any[]).length,
        totalRevenue: confirmed.reduce((n, b) => n + b.total_amount, 0),
      },
      bookings: rows,
      movies: (movies.data ?? []) as any[],
      screens: (screens.data ?? []) as any[],
      shows: (shows.data ?? []) as any[],
    };
  });

export type MovieInput = {
  id?: string;
  title: string;
  poster_url: string;
  genre: string;
  duration_min: number;
  language: string;
  rating: number;
  age_rating: string;
  description: string;
  cast_list: string[];
  trailer_url: string;
  status: string;
};

export const saveMovie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: MovieInput) => {
    if (!data.title.trim()) throw new Error("Title is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("movies").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("movies")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const deleteMovie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("movies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveShow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      id?: string;
      movie_id: string;
      screen_id: string;
      show_date: string;
      show_time: string;
      base_price: number;
    }) => {
      if (!data.movie_id || !data.screen_id) throw new Error("Pick a movie and a screen");
      if (!data.show_date || !data.show_time) throw new Error("Pick a date and time");
      if (data.base_price < 50) throw new Error("Base price must be at least 50");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("shows").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("shows")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const deleteShow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("shows").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
