import { createFileRoute } from "@tanstack/react-router";
import {
  MapPin,
  Phone,
  Clock,
  Car,
  Utensils,
  Volume2,
  Armchair,
  Accessibility,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CineVerse Cinemas | Bengaluru's Premium Single Theater" },
      {
        name: "description",
        content:
          "CineVerse Cinemas on MG Road, Bengaluru: eight auditoriums, Dolby Atmos, IMAX with Laser, recliner lounges, parking, dining and full accessibility.",
      },
      { property: "og:title", content: "About CineVerse Cinemas" },
      {
        property: "og:description",
        content: "Address, hours, parking, food and accessibility at CineVerse Cinemas.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl tracking-wide sm:text-5xl">About CineVerse Cinemas</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        CineVerse opened on MG Road in 2016 with one stubborn idea: a night at the movies should feel
        like an event. Eight auditoriums, laser projection end to end, seats you sink into, and a
        sound system tuned every fortnight by our own engineers. No adverts after showtime — the film
        starts when the ticket says it does.
      </p>

      <img
        src="/images/theater-hall.jpg"
        alt="A CineVerse auditorium with recliner seating facing a lit screen"
        loading="lazy"
        width={1920}
        height={1088}
        className="mt-10 aspect-21/9 w-full rounded-3xl border border-border object-cover shadow-cinema"
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <Info icon={<MapPin className="size-5" />} title="Address">
          CineVerse Cinemas, 4th Floor, Orion Mall, MG Road, Bengaluru, Karnataka 560001
        </Info>
        <Info icon={<Phone className="size-5" />} title="Contact">
          +91 80 4567 8900
          <br />
          Box office: +91 80 4567 8911
        </Info>
        <Info icon={<Mail className="size-5" />} title="Email">
          hello@cineverse.example
          <br />
          groups@cineverse.example
        </Info>
        <Info icon={<Clock className="size-5" />} title="Opening Hours">
          Daily 9:00 AM – 1:30 AM. Box office opens 30 minutes before the first show.
        </Info>
        <Info icon={<Car className="size-5" />} title="Parking">
          900 covered bays in the mall basement. Free for the first 3 hours with a same-day ticket;
          valet available at the north entrance.
        </Info>
        <Info icon={<Utensils className="size-5" />} title="Food & Beverages">
          Truffle popcorn, wood-fired pizzas, cold brew and a full mocktail bar. Seat-side service in
          all recliner auditoriums.
        </Info>
        <Info icon={<Volume2 className="size-5" />} title="Dolby Atmos">
          Screens 1 and 4 run 64-channel Dolby Atmos; Screen 2 is IMAX with Laser and a 26-metre
          screen.
        </Info>
        <Info icon={<Armchair className="size-5" />} title="Recliner Seats">
          Screen 3 is our Recliner Lounge: 88 full-recline leather loungers with heated footrests and
          side tables.
        </Info>
        <Info icon={<Accessibility className="size-5" />} title="Accessibility">
          Step-free access throughout, wheelchair spaces with companion seating in every auditorium,
          hearing loops, and audio-described screenings every weekend.
        </Info>
      </div>
    </div>
  );
}

function Info({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hover-lift rounded-2xl border border-border bg-card p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <h2 className="mt-4 font-display text-xl tracking-wide">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
