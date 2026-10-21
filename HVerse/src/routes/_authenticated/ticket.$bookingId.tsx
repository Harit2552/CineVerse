import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, Home, Ticket } from "lucide-react";
import { getMyBooking } from "@/lib/bookings.functions";
import { QrTicketCode } from "@/components/booking/QrTicketCode";
import { Button } from "@/components/ui/button";
import { downloadTicket } from "@/lib/ticket";
import { formatINR, formatShortDate, formatTime } from "@/lib/cinema";

const bookingQuery = (bookingId: string) =>
  queryOptions({
    queryKey: ["booking", bookingId],
    queryFn: () => getMyBooking({ data: { bookingId } }),
  });

export const Route = createFileRoute("/_authenticated/ticket/$bookingId")({
  head: () => ({
    meta: [
      { title: "Booking Confirmed | CineVerse Cinemas" },
      { name: "description", content: "Your CineVerse Cinemas ticket and QR code." },
      { property: "og:title", content: "Booking Confirmed | CineVerse Cinemas" },
      { property: "og:description", content: "Show this QR code at the entrance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load this ticket.</p>
  ),
  component: TicketPage,
});

function TicketPage() {
  const { bookingId } = Route.useParams();
  const { data: booking } = useSuspenseQuery(bookingQuery(bookingId));

  if (!booking) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-3xl">Ticket not found</h1>
        <Button asChild className="mt-6">
          <Link to="/my-bookings">View my bookings</Link>
        </Button>
      </div>
    );
  }

  const { show } = booking;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="fade-up text-center">
        <CheckCircle2 className="mx-auto size-14 text-seat-available" aria-hidden="true" />
        <h1 className="mt-4 font-display text-4xl tracking-wide">Booking Confirmed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve saved this ticket to your account. Show the QR code at the entrance.
        </p>
      </div>

      <div className="fade-up mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-cinema">
        <div className="marquee-bg h-2 w-full" aria-hidden="true" />
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">CineVerse Cinemas</p>
            <h2 className="mt-2 font-display text-3xl tracking-wide">{show.movie.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {show.movie.genre} · {show.movie.language} · {show.movie.age_rating}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Item label="Booking ID" value={booking.booking_code} />
              <Item label="Date" value={formatShortDate(show.show_date)} />
              <Item label="Time" value={formatTime(show.show_time)} />
              <Item label="Screen" value={show.screen.name} />
              <Item label="Seats" value={booking.seats.join(", ")} />
              <Item label="Amount" value={formatINR(booking.total_amount)} />
            </dl>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-border pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <QrTicketCode value={booking.booking_code} pixel={6} />
            <p className="text-[10px] tracking-widest text-muted-foreground">
              {booking.booking_code}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() =>
            downloadTicket({
              bookingCode: booking.booking_code,
              movie: show.movie.title,
              date: formatShortDate(show.show_date),
              time: formatTime(show.show_time),
              screen: show.screen.name,
              seats: booking.seats.join(", "),
              amount: formatINR(booking.total_amount),
            })
          }
        >
          <Download className="size-4" /> Download Ticket
        </Button>
        <Button asChild variant="outline">
          <Link to="/my-bookings">
            <Ticket className="size-4" /> View My Bookings
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">
            <Home className="size-4" /> Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
