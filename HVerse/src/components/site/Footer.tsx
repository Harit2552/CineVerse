import { Link } from "@tanstack/react-router";
import { Clapperboard, MapPin, Phone, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="marquee-bg flex size-8 items-center justify-center rounded-lg text-primary-foreground">
              <Clapperboard className="size-4" aria-hidden="true" />
            </span>
            <span className="font-display text-2xl">
              Cine<span className="marquee-text">Verse</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            A single-screen-obsessed, eight-auditorium cinema built for people who still believe the
            big screen wins.
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-wide">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/movies" className="hover:text-primary">
                Movies
              </Link>
            </li>
            <li>
              <Link to="/shows" className="hover:text-primary">
                Today&apos;s Shows
              </Link>
            </li>
            <li>
              <Link to="/my-bookings" className="hover:text-primary">
                My Bookings
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                About the Theater
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-wide">Visit Us</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              CineVerse Cinemas, 4th Floor, Orion Mall, MG Road, Bengaluru 560001
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              +91 80 4567 8900
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              Daily, 9:00 AM – 1:30 AM
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg tracking-wide">Experience</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Dolby Atmos &amp; IMAX with Laser</li>
            <li>Full-recline leather loungers</li>
            <li>Chef-led food &amp; beverage counter</li>
            <li>Step-free access and companion seating</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CineVerse Cinemas. Demo booking platform — payments are
        simulated.
      </div>
    </footer>
  );
}
