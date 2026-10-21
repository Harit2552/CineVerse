import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CreditCard } from "lucide-react";
import { getShowDetail } from "@/lib/catalog.functions";
import { SeatMap } from "@/components/booking/SeatMap";
import { SummaryPanel } from "@/components/booking/SummaryPanel";
import { Button } from "@/components/ui/button";
import { formatINR, formatTime, priceBreakdown, runtime } from "@/lib/cinema";

const showQuery = (showId: string) =>
  queryOptions({
    queryKey: ["show", showId],
    queryFn: () => getShowDetail({ data: { showId } }),
  });

export const Route = createFileRoute("/book/$showId")({
  loader: async ({ context, params }) => {
    const detail = await context.queryClient.ensureQueryData(showQuery(params.showId));
    if (!detail) throw notFound();
    return { title: detail.show.movie.title };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Show unavailable | CineVerse" }, { name: "robots", content: "noindex" }] };
    }
    const title = `Select Seats — ${loaderData.title} | CineVerse Cinemas`;
    return {
      meta: [
        { title },
        { name: "description", content: `Choose your exact seats for ${loaderData.title} at CineVerse Cinemas.` },
        { property: "og:title", content: title },
        { property: "og:description", content: "Live seat map with instant pricing." },
      ],
    };
  },
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load this seat map.</p>
  ),
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <h1 className="font-display text-3xl">Show not found</h1>
      <Button asChild className="mt-6">
        <Link to="/shows">See all showtimes</Link>
      </Button>
    </div>
  ),
  component: SeatSelection,
});

function SeatSelection() {
  const { showId } = Route.useParams();
  const { data } = useSuspenseQuery(showQuery(showId));
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);

  if (!data) return null;
  const { show, takenSeats } = data;

  function toggle(seatId: string) {
    setSelected((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
      if (prev.length >= 10) {
        toast.error("You can book up to 10 seats in one booking");
        return prev;
      }
      return [...prev, seatId].sort();
    });
  }

  const price = priceBreakdown(show.base_price, selected);

  function proceed() {
    if (selected.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    navigate({
      to: "/checkout/$showId",
      params: { showId },
      search: { seats: selected.join(",") },
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        to="/movies/$movieId"
        params={{ movieId: show.movie.id }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to showtimes
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">{show.movie.title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatTime(show.show_time)} · {show.screen.name} · {show.screen.format} ·{" "}
          {runtime(show.movie.duration_min)}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <SeatMap
          taken={takenSeats}
          selected={selected}
          basePrice={show.base_price}
          onToggle={toggle}
        />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <SummaryPanel
            movieTitle={show.movie.title}
            date={show.show_date}
            time={show.show_time}
            screen={show.screen.name}
            seats={selected}
            basePrice={show.base_price}
          >
            <Button
              size="lg"
              className="w-full"
              disabled={selected.length === 0}
              onClick={proceed}
            >
              <CreditCard className="size-4" /> Proceed to Payment
            </Button>
            {selected.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Select at least one seat to continue.
              </p>
            ) : null}
          </SummaryPanel>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t px-4 py-3 lg:hidden">
        <div>
          <p className="text-xs text-muted-foreground">
            {selected.length ? selected.join(", ") : "No seats selected"}
          </p>
          <p className="font-display text-xl">{formatINR(price.total)}</p>
        </div>
        <Button disabled={selected.length === 0} onClick={proceed}>
          Proceed
        </Button>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
