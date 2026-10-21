import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Clock, MapPin, Ticket, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelBooking, listMyBookings, type BookingDetail } from "@/lib/bookings.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatINR, formatLongDate, formatTime, todayISO } from "@/lib/cinema";

const bookingsQuery = queryOptions({
  queryKey: ["my-bookings"],
  queryFn: () => listMyBookings(),
});

export const Route = createFileRoute("/_authenticated/my-bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings | CineVerse Cinemas" },
      {
        name: "description",
        content: "View, download and cancel your CineVerse Cinemas movie tickets.",
      },
      { property: "og:title", content: "My Bookings | CineVerse Cinemas" },
      { property: "og:description", content: "All your CineVerse tickets in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load your bookings.</p>
  ),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const { data: bookings } = useSuspenseQuery(bookingsQuery);
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<BookingDetail | null>(null);

  const cancel = useMutation({
    mutationFn: (bookingId: string) => cancelBooking({ data: { bookingId } }),
    onSuccess: async () => {
      toast.success("Booking cancelled", { description: "Your seats have been released." });
      setPending(null);
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const today = todayISO();
  const active = bookings.filter((b) => b.status === "confirmed" && b.show.show_date >= today);
  const past = bookings.filter((b) => b.status === "confirmed" && b.show.show_date < today);
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Your account</p>
        <h1 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">My Bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {bookings.length} booking{bookings.length === 1 ? "" : "s"} at CineVerse Cinemas.
        </p>
      </header>

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({active.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          <List
            bookings={active}
            empty="No upcoming shows yet."
            onCancel={(b) => setPending(b)}
          />
        </TabsContent>
        <TabsContent value="past" className="mt-6 space-y-4">
          <List bookings={past} empty="Your watched shows will appear here." />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6 space-y-4">
          <List bookings={cancelled} empty="No cancelled bookings." />
        </TabsContent>
      </Tabs>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending
                ? `Seats ${pending.seats.join(", ")} for ${pending.show.movie.title} will be released and made available to other guests.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancel.isPending}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pending) cancel.mutate(pending.id);
              }}
            >
              {cancel.isPending ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function List({
  bookings,
  empty,
  onCancel,
}: {
  bookings: BookingDetail[];
  empty: string;
  onCancel?: (booking: BookingDetail) => void;
}) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <Ticket className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
        <Button asChild className="mt-6">
          <Link to="/movies">Browse movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {bookings.map((booking) => (
        <article
          key={booking.id}
          className="fade-up flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:p-5"
        >
          <img
            src={booking.show.movie.poster_url}
            alt={`${booking.show.movie.title} poster`}
            loading="lazy"
            className="h-40 w-28 shrink-0 rounded-xl object-cover"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl tracking-wide">{booking.show.movie.title}</h2>
              <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                {booking.status === "confirmed" ? "Confirmed" : "Cancelled"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Booking ID {booking.booking_code}
            </p>

            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatLongDate(booking.show.show_date)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-4" aria-hidden="true" />
                {formatTime(booking.show.show_time)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" />
                {booking.show.screen.name} · {booking.show.screen.format}
              </span>
              <span className="flex items-center gap-2">
                <Ticket className="size-4" aria-hidden="true" />
                Seats {booking.seats.join(", ")}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="font-display text-2xl">{formatINR(booking.total_amount)}</span>
              <Button asChild size="sm" variant="outline">
                <Link to="/ticket/$bookingId" params={{ bookingId: booking.id }}>
                  View ticket
                </Link>
              </Button>
              {onCancel ? (
                <Button size="sm" variant="ghost" onClick={() => onCancel(booking)}>
                  <XCircle className="size-4" /> Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </>
  );
}
