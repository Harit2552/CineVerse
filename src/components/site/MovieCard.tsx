import { Link } from "@tanstack/react-router";
import { Star, Clock, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runtime, formatShortDate } from "@/lib/cinema";
import type { Movie } from "@/lib/catalog.functions";

export function MovieCard({ movie }: { movie: Movie }) {
  const comingSoon = movie.status === "coming_soon";

  return (
    <article className="hover-lift group overflow-hidden rounded-2xl border border-border bg-card">
      <Link
        to="/movies/$movieId"
        params={{ movieId: movie.id }}
        className="relative block aspect-2/3 overflow-hidden"
      >
        <img
          src={movie.poster_url}
          alt={`${movie.title} poster`}
          loading="lazy"
          width={640}
          height={960}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="veil absolute inset-0" aria-hidden="true" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary" className="bg-background/70 backdrop-blur">
            {movie.age_rating}
          </Badge>
          {comingSoon ? <Badge className="bg-accent text-accent-foreground">Coming Soon</Badge> : null}
        </div>
        {!comingSoon ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/75 px-2 py-1 text-xs font-semibold backdrop-blur">
            <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
            {movie.rating.toFixed(1)}
          </div>
        ) : null}
      </Link>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-1 font-display text-xl tracking-wide">{movie.title}</h3>
        <p className="text-xs text-muted-foreground">{movie.genre}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" /> {runtime(movie.duration_min)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Languages className="size-3" aria-hidden="true" /> {movie.language}
          </span>
        </div>
        {comingSoon ? (
          <p className="text-xs text-primary">
            In cinemas {movie.release_date ? formatShortDate(movie.release_date) : "soon"}
          </p>
        ) : null}
        <Button asChild className="w-full" variant={comingSoon ? "outline" : "default"}>
          <Link to="/movies/$movieId" params={{ movieId: movie.id }}>
            {comingSoon ? "View Details" : "Book Now"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
