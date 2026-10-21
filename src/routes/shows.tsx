import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listShowsForDate } from "@/lib/catalog.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dayParts, formatLongDate, formatTime, nextDays, runtime, todayISO, TOTAL_SEATS } from "@/lib/cinema";

const showsQuery = (date: string) =>
  queryOptions({
    queryKey: ["shows", "date", date],
    queryFn: () => listShowsForDate({ data: { date } }),
  });

export const Route = createFileRoute("/shows")({
  head: () => ({
    meta: [
      { title: "Showtimes & Schedule | CineVerse Cinemas" },
      {
        name: "description",
        content:
          "See every showtime at CineVerse Cinemas for the next seven days across our Dolby Atmos, IMAX and recliner screens.",
      },
      { property: "og:title", content: "Showtimes at CineVerse Cinemas" },
      { property: "og:description", content: "Seven days of screenings across eight auditoriums." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(showsQuery(todayISO())),
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load the schedule.</p>
  ),
  component: ShowsPage,
});

function ShowsPage() {
  const [date, setDate] = useState(todayISO());
  const { data: shows } = useSuspenseQuery(showsQuery(date));
  const dates = nextDays(7);
  const movieIds = Array.from(new Set(shows.map((s) => s.movie.id)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl tracking-wide sm:text-5xl">Shows</h1>
      <p className="mt-2 text-sm text-muted-foreground">{formatLongDate(date)}</p>

      <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
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

      {movieIds.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No screenings scheduled for this date.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {movieIds.map((movieId) => {
            const group = shows.filter((s) => s.movie.id === movieId);
            const movie = group[0]!.movie;
            return (
              <div
                key={movieId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
              >
                <img
                  src={movie.poster_url}
                  alt=""
                  loading="lazy"
                  width={640}
                  height={960}
                  className="h-28 w-20 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/movies/$movieId"
                    params={{ movieId }}
                    className="font-display text-xl tracking-wide hover:text-primary"
                  >
                    {movie.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {movie.genre} · {runtime(movie.duration_min)} · {movie.language} ·{" "}
                    {movie.age_rating}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.map((show) => (
                    <Button key={show.id} asChild variant="outline" size="sm">
                      <Link to="/book/$showId" params={{ showId: show.id }}>
                        <span className="flex flex-col items-start leading-tight">
                          <span>{formatTime(show.show_time)}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {show.screen.name} · {TOTAL_SEATS} seats
                          </span>
                        </span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
