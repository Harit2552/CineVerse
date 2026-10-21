import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Clock, Languages, Play, Armchair } from "lucide-react";
import { getMovie, listShowsForMovie } from "@/lib/catalog.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  dayParts,
  formatTime,
  nextDays,
  runtime,
  todayISO,
  TOTAL_SEATS,
  formatINR,
} from "@/lib/cinema";

const movieQuery = (movieId: string) =>
  queryOptions({
    queryKey: ["movie", movieId],
    queryFn: () => getMovie({ data: { movieId } }),
  });

const showsQuery = (movieId: string, date: string) =>
  queryOptions({
    queryKey: ["shows", movieId, date],
    queryFn: () => listShowsForMovie({ data: { movieId, date } }),
  });

export const Route = createFileRoute("/movies/$movieId")({
  loader: async ({ context, params }) => {
    const movie = await context.queryClient.ensureQueryData(movieQuery(params.movieId));
    if (!movie) throw notFound();

    const date = todayISO();
    await context.queryClient.ensureQueryData(showsQuery(params.movieId, date));
    return { title: movie.title, description: movie.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Movie unavailable | CineVerse" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — Showtimes & Tickets | CineVerse Cinemas`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description.slice(0, 155) },
      ],
    };
  },
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load this movie.</p>
  ),
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <h1 className="font-display text-3xl">Movie not found</h1>
      <Button asChild className="mt-6">
        <Link to="/movies">Back to movies</Link>
      </Button>
    </div>
  ),
  component: MovieDetail,
});

function MovieDetail() {
  const { movieId } = Route.useParams();
  const { data: movie } = useSuspenseQuery(movieQuery(movieId));
  const [date, setDate] = useState(todayISO());
  const { data: shows } = useSuspenseQuery(showsQuery(movieId, date));
  const dates = nextDays(7);

  if (!movie) return null;
  const comingSoon = movie.status === "coming_soon";

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-border">
        <img src={movie.poster_url} alt="" className="absolute inset-0 size-full object-cover opacity-20 blur-2xl" />
        <div className="veil absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[260px_1fr]">
          <img
            src={movie.poster_url}
            alt={`${movie.title} poster`}
            width={640}
            height={960}
            className="w-52 justify-self-center rounded-2xl border border-border object-cover shadow-cinema md:w-full"
          />
          <div>
            <h1 className="font-display text-4xl tracking-wide sm:text-6xl">{movie.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {!comingSoon ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Star className="size-4 fill-primary" aria-hidden="true" /> {movie.rating.toFixed(1)}/10
                </span>
              ) : (
                <Badge className="bg-accent text-accent-foreground">Coming Soon</Badge>
              )}
              <span>{movie.genre}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden="true" /> {runtime(movie.duration_min)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Languages className="size-4" aria-hidden="true" /> {movie.language}
              </span>
              <Badge variant="secondary">{movie.age_rating}</Badge>
            </div>

            <p className="mt-6 max-w-2xl text-muted-foreground">{movie.description}</p>

            <div className="mt-6">
              <h2 className="font-display text-lg tracking-wide">Cast</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {movie.cast_list.map((person) => (
                  <Badge key={person} variant="secondary" className="font-normal">
                    {person}
                  </Badge>
                ))}
              </div>
            </div>

            {movie.trailer_url ? (
              <Button asChild variant="outline" className="mt-6">
                <a href={movie.trailer_url} target="_blank" rel="noreferrer">
                  <Play className="size-4" /> Watch Trailer
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {comingSoon ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <h2 className="font-display text-2xl tracking-wide">Bookings open soon</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ll open seats for {movie.title} closer to release.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl tracking-wide">Select Date</h2>
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
              {dates.map((d) => {
                const parts = dayParts(d);
                const active = d === date;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-20 shrink-0 flex-col items-center rounded-xl border px-3 py-3 transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground",
                    )}
                  >
                    <span className="text-xs font-semibold">{parts.weekday}</span>
                    <span className="font-display text-2xl leading-tight">{parts.day}</span>
                    <span className="text-[10px]">{parts.month}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="mt-10 font-display text-2xl tracking-wide">Select Showtime</h2>
            {shows.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No shows scheduled for this date. Try another day.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {shows.map((show) => {
                  const available = TOTAL_SEATS - (show.booked_count ?? 0);
                  const soldOut = available <= 0;
                  return (
                    <Link
                      key={show.id}
                      to="/book/$showId"
                      params={{ showId: show.id }}
                      disabled={soldOut}
                      className={cn(
                        "hover-lift rounded-2xl border border-border bg-card p-4 transition-colors",
                        soldOut
                          ? "pointer-events-none opacity-50"
                          : "hover:border-primary/70 hover:bg-secondary",
                      )}
                    >
                      <p className="font-display text-2xl tracking-wide">
                        {formatTime(show.show_time)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {show.screen.name} · {show.screen.format}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1 text-xs text-seat-available">
                        <Armchair className="size-3" aria-hidden="true" />
                        {soldOut ? "Sold out" : `${available} seats available`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        From {formatINR(show.base_price)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
