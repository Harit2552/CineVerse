import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listMovies } from "@/lib/catalog.functions";
import { MovieCard } from "@/components/site/MovieCard";

const moviesQuery = queryOptions({ queryKey: ["movies"], queryFn: () => listMovies() });

export const Route = createFileRoute("/movies/")({
  head: () => ({
    meta: [
      { title: "Movies Now Showing & Coming Soon | CineVerse Cinemas" },
      {
        name: "description",
        content:
          "Browse every film playing at CineVerse Cinemas, check ratings, runtime and language, and book your seat in seconds.",
      },
      { property: "og:title", content: "Movies at CineVerse Cinemas" },
      {
        property: "og:description",
        content: "Now showing and coming soon at CineVerse Cinemas.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(moviesQuery),
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load the movie list.</p>
  ),
  component: MoviesPage,
});

function MoviesPage() {
  const { data: movies } = useSuspenseQuery(moviesQuery);
  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl tracking-wide sm:text-5xl">Movies</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything on our screens this fortnight.
      </p>

      <h2 className="mt-12 font-display text-2xl tracking-wide">Now Showing</h2>
      {nowShowing.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nothing on our screens right now.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {nowShowing.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      <h2 className="mt-16 font-display text-2xl tracking-wide">Coming Soon</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {comingSoon.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
