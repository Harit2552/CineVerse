import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Star, Play, Clock, Ticket, Armchair, Volume2, Utensils, Accessibility, MapPin, Phone } from "lucide-react";
import { listMovies, listShowsForDate } from "@/lib/catalog.functions";
import { MovieCard } from "@/components/site/MovieCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime, runtime, todayISO, formatLongDate, formatINR } from "@/lib/cinema";

const moviesQuery = queryOptions({ queryKey: ["movies"], queryFn: () => listMovies() });
const todayShowsQuery = (date: string) =>
  queryOptions({
    queryKey: ["shows", "date", date],
    queryFn: () => listShowsForDate({ data: { date } }),
  });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineVerse Cinemas | Book Movie Tickets & Pick Your Seat" },
      {
        name: "description",
        content:
          "Now showing at CineVerse Cinemas: Interstellar, Dune: Part Two, Inception and more. Live seat maps, Dolby Atmos and IMAX, instant digital tickets.",
      },
      { property: "og:title", content: "CineVerse Cinemas | Book Movie Tickets" },
      {
        property: "og:description",
        content: "Pick your exact seat, pay in seconds, and walk in with a digital ticket.",
      },
    ],
  }),
  loader: async ({ context }) => {
    const date = todayISO();
    await Promise.all([
      context.queryClient.ensureQueryData(moviesQuery),
      context.queryClient.ensureQueryData(todayShowsQuery(date)),
    ]);
    return { date };
  },
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load today&apos;s lineup.</p>
  ),
  component: Home,
});

function Home() {
  const { date } = Route.useLoaderData();
  const { data: movies } = useSuspenseQuery(moviesQuery);
  const { data: shows } = useSuspenseQuery(todayShowsQuery(date));

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");
  const featured = nowShowing[0];

  return (
    <div>
      {/* HERO */}
      {featured ? (
        <section className="relative isolate overflow-hidden">
          <img
            src="/images/theater-hall.jpg"
            alt=""
            width={1920}
            height={1088}
            className="absolute inset-0 size-full object-cover opacity-35"
          />
          <div className="veil absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
            <div className="fade-up">
              <Badge className="mb-5 bg-primary/15 text-primary">Now trending at CineVerse</Badge>
              <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">
                {featured.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-primary">
                  <Star className="size-4 fill-primary" aria-hidden="true" />
                  {featured.rating.toFixed(1)}/10
                </span>
                <span>{featured.genre}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden="true" /> {runtime(featured.duration_min)}
                </span>
                <span>{featured.language}</span>
                <Badge variant="secondary">{featured.age_rating}</Badge>
              </div>
              <p className="mt-6 max-w-xl text-base text-muted-foreground">{featured.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/movies/$movieId" params={{ movieId: featured.id }}>
                    <Ticket className="size-4" /> Book Tickets
                  </Link>
                </Button>
                {featured.trailer_url ? (
                  <Button asChild size="lg" variant="outline">
                    <a href={featured.trailer_url} target="_blank" rel="noreferrer">
                      <Play className="size-4" /> Watch Trailer
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="fade-up mx-auto w-64 overflow-hidden rounded-3xl border border-border shadow-cinema sm:w-80">
              <img
                src={featured.poster_url}
                alt={`${featured.title} poster`}
                width={640}
                height={960}
                className="size-full object-cover"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* NOW SHOWING */}
      <Section
        title="Now Showing"
        subtitle="Playing across our eight auditoriums today"
        action={<Link to="/movies" className="text-sm text-primary hover:underline">All movies</Link>}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {nowShowing.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </Section>

      {/* TODAY'S SHOWTIMES */}
      <Section
        title="Today's Showtimes"
        subtitle={formatLongDate(date)}
        action={<Link to="/shows" className="text-sm text-primary hover:underline">Full schedule</Link>}
      >
        {shows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No shows scheduled today. Please check back tomorrow.
          </p>
        ) : (
          <div className="space-y-4">
            {Array.from(new Set(shows.map((s) => s.movie.id))).map((movieId) => {
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
                    className="h-24 w-16 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl tracking-wide">{movie.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {movie.genre} · {runtime(movie.duration_min)} · {movie.language}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.map((show) => (
                      <Button key={show.id} asChild variant="outline" size="sm">
                        <Link to="/book/$showId" params={{ showId: show.id }}>
                          {formatTime(show.show_time)}
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            {show.screen.name}
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
      </Section>

      {/* COMING SOON */}
      <Section title="Coming Soon" subtitle="Advance bookings open two weeks before release">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </Section>

      {/* FACILITIES */}
      <Section title="Theater Facilities" subtitle="Built for people who take movies seriously">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Facility icon={<Volume2 className="size-5" />} title="Dolby Atmos" text="64-channel object audio calibrated per auditorium." />
          <Facility icon={<Armchair className="size-5" />} title="Recliner Seats" text="Full-recline leather loungers with heated footrests." />
          <Facility icon={<Utensils className="size-5" />} title="Food & Beverage" text="Chef-led kitchen with seat-side service." />
          <Facility icon={<Accessibility className="size-5" />} title="Accessible" text="Step-free access, companion seats, audio description." />
        </div>
      </Section>

      {/* LOCATION */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="glass grid gap-6 rounded-3xl p-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-2xl tracking-wide">Find Us</h3>
            <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              4th Floor, Orion Mall, MG Road, Bengaluru 560001
            </p>
          </div>
          <div>
            <h3 className="font-display text-2xl tracking-wide">Talk To Us</h3>
            <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              +91 80 4567 8900 · hello@cineverse.example
            </p>
          </div>
          <div>
            <h3 className="font-display text-2xl tracking-wide">Tickets From</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Regular from {formatINR(180)} · Premium from {formatINR(250)} · VIP recliners from{" "}
              {formatINR(320)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wide sm:text-4xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Facility({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="hover-lift rounded-2xl border border-border bg-card p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-xl tracking-wide">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
