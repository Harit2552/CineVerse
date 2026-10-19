import type { ReactNode } from "react";
import { Ticket } from "lucide-react";
import { formatINR, formatLongDate, formatTime, priceBreakdown, seatTypeOf, SEAT_TYPE_LABEL } from "@/lib/cinema";
import { Separator } from "@/components/ui/separator";

type Props = {
  movieTitle: string;
  date: string;
  time: string;
  screen: string;
  seats: string[];
  basePrice: number;
  children?: ReactNode;
};

export function SummaryPanel({
  movieTitle,
  date,
  time,
  screen,
  seats,
  basePrice,
  children,
}: Props) {
  const price = priceBreakdown(basePrice, seats);
  const types = Array.from(new Set(seats.map((s) => SEAT_TYPE_LABEL[seatTypeOf(s)])));

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="flex items-center gap-2 font-display text-xl tracking-wide">
        <Ticket className="size-5 text-primary" aria-hidden="true" /> Booking Summary
      </h2>

      <dl className="mt-5 space-y-3 text-sm">
        <Row label="Movie" value={movieTitle} />
        <Row label="Date" value={formatLongDate(date)} />
        <Row label="Show" value={formatTime(time)} />
        <Row label="Screen" value={screen} />
        <Row
          label="Selected Seats"
          value={seats.length ? seats.join(", ") : "None yet"}
          highlight={seats.length > 0}
        />
        {types.length ? <Row label="Seat Type" value={types.join(" · ")} /> : null}
      </dl>

      <Separator className="my-5" />

      <dl className="space-y-2 text-sm">
        <Row label={`Ticket Price (${seats.length})`} value={formatINR(price.ticketTotal)} />
        <Row label="Convenience Fee" value={formatINR(price.convenienceFee)} />
        <Row label="Taxes (18%)" value={formatINR(price.taxes)} />
      </dl>

      <Separator className="my-5" />

      <div className="flex items-baseline justify-between">
        <span className="font-display text-xl tracking-wide">Total</span>
        <span className="font-display text-3xl marquee-text">{formatINR(price.total)}</span>
      </div>

      {children ? <div className="mt-5 space-y-3">{children}</div> : null}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={highlight ? "text-right font-semibold text-primary" : "text-right font-medium"}>
        {value}
      </dd>
    </div>
  );
}
