import { createServerFn } from "@tanstack/react-start";

export type Movie = {
  id: string;
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
  release_date: string | null;
};

export type ShowRow = {
  id: string;
  movie_id: string;
  screen_id: string;
  show_date: string;
  show_time: string;
  base_price: number;
  screen: { id: string; name: string; format: string; total_seats: number };
};

const MOVIE_COLUMNS =
  "id,title,poster_url,genre,duration_min,language,rating,age_rating,description,cast_list,trailer_url,status,release_date";

export const listMovies = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./public-db.server");
  const { data, error } = await publicDb()
    .from("movies")
    .select(MOVIE_COLUMNS)
    .order("status", { ascending: true })
    .order("rating", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Movie[];
});

export const getMovie = createServerFn({ method: "GET" })
  .inputValidator((data: { movieId: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const { data: movie, error } = await publicDb()
      .from("movies")
      .select(MOVIE_COLUMNS)
      .eq("id", data.movieId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (movie ?? null) as unknown as Movie | null;
  });

export const listShowsForMovie = createServerFn({ method: "GET" })
  .inputValidator((data: { movieId: string; date: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const db = publicDb();
    const { data: shows, error } = await db
      .from("shows")
      .select("id,movie_id,screen_id,show_date,show_time,base_price,screen:screens(*)")
      .eq("movie_id", data.movieId)
      .eq("show_date", data.date)
      .order("show_time", { ascending: true });
    if (error) throw new Error(error.message);

    const rows = (shows ?? []) as unknown as ShowRow[];
    if (rows.length === 0) return [];

    const { data: taken, error: seatError } = await db
      .from("booking_seats")
      .select("show_id")
      .in(
        "show_id",
        rows.map((s) => s.id),
      );
    if (seatError) throw new Error(seatError.message);

    const counts = new Map<string, number>();
    for (const seat of taken ?? []) {
      counts.set(seat.show_id, (counts.get(seat.show_id) ?? 0) + 1);
    }
    return rows.map((s) => ({ ...s, booked_count: counts.get(s.id) ?? 0 }));
  });

export const listShowsForDate = createServerFn({ method: "GET" })
  .inputValidator((data: { date: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const { data: shows, error } = await publicDb()
      .from("shows")
      .select(
        `id,movie_id,screen_id,show_date,show_time,base_price,screen:screens(*),movie:movies(${MOVIE_COLUMNS})`,
      )
      .eq("show_date", data.date)
      .order("show_time", { ascending: true });
    if (error) throw new Error(error.message);
    return (shows ?? []) as unknown as (ShowRow & { movie: Movie })[];
  });

export const getShowDetail = createServerFn({ method: "GET" })
  .inputValidator((data: { showId: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const db = publicDb();
    const { data: show, error } = await db
      .from("shows")
      .select(
        `id,movie_id,screen_id,show_date,show_time,base_price,screen:screens(*),movie:movies(${MOVIE_COLUMNS})`,
      )
      .eq("id", data.showId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!show) return null;

    const { data: taken, error: seatError } = await db
      .from("booking_seats")
      .select("seat_id")
      .eq("show_id", data.showId);
    if (seatError) throw new Error(seatError.message);

    return {
      show: show as unknown as ShowRow & { movie: Movie },
      takenSeats: (taken ?? []).map((s) => s.seat_id),
    };
  });
