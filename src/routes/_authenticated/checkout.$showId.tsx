import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Smartphone, CreditCard, Landmark, Wallet, ShieldCheck } from "lucide-react";
import { getShowDetail } from "@/lib/catalog.functions";
import { createBooking } from "@/lib/bookings.functions";
import { SummaryPanel } from "@/components/booking/SummaryPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR, priceBreakdown } from "@/lib/cinema";
import { cn } from "@/lib/utils";

const showQuery = (showId: string) =>
  queryOptions({
    queryKey: ["show", showId],
    queryFn: () => getShowDetail({ data: { showId } }),
  });

export const Route = createFileRoute("/_authenticated/checkout/$showId")({
  validateSearch: z.object({ seats: z.string().default("") }),
  head: () => ({
    meta: [
      { title: "Secure Checkout | CineVerse Cinemas" },
      { name: "description", content: "Pay for your CineVerse Cinemas seats — simulated demo payment." },
      { property: "og:title", content: "Checkout | CineVerse Cinemas" },
      { property: "og:description", content: "Complete your seat booking." },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">Checkout couldn&apos;t be loaded.</p>
  ),
  component: Checkout,
});

const METHODS = [
  { id: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", hint: "All major Indian banks", icon: Landmark },
  { id: "wallet", label: "Wallet", hint: "CineVerse wallet balance", icon: Wallet },
] as const;

function Checkout() {
  const { showId } = Route.useParams();
  const { seats: seatParam } = Route.useSearch();
  const { data } = useSuspenseQuery(showQuery(showId));
  const navigate = useNavigate();
  const book = useServerFn(createBooking);

  const seats = seatParam.split(",").map((s) => s.trim()).filter(Boolean);
  const [method, setMethod] = useState<string>("upi");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  if (!data) return null;
  const { show, takenSeats } = data;
  const price = priceBreakdown(show.base_price, seats);
  const clash = seats.filter((s) => takenSeats.includes(s));

  if (seats.length === 0) {
    return (
      <EmptyState
        title="No seats selected"
        text="Pick your seats first and we'll bring you right back here."
        showId={showId}
      />
    );
  }

  if (clash.length > 0) {
    return (
      <EmptyState
        title="Those seats were just taken"
        text={`${clash.join(", ")} is no longer available. Please choose different seats.`}
        showId={showId}
      />
    );
  }

  function validate() {
    if (method === "upi" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(detail)) {
      setError("Enter a valid UPI ID, e.g. name@bank");
      return false;
    }
    if (method === "card" && detail.replace(/\s/g, "").length !== 16) {
      setError("Enter the 16-digit card number");
      return false;
    }
    if (method === "netbanking" && detail.trim().length < 3) {
      setError("Choose your bank");
      return false;
    }
    setError("");
    return true;
  }

  async function pay() {
    if (!validate()) return;
    setPaying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1600));
      const result = await book({ data: { showId, seats, paymentMethod: method } });
      toast.success("Payment successful");
      navigate({ to: "/ticket/$bookingId", params: { bookingId: result.bookingId } });
    } catch (err) {
      setPaying(false);
      toast.error(err instanceof Error ? err.message : "Payment could not be completed");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl tracking-wide sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is a demo cinema — no money moves, but the seats are really reserved.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-display text-xl tracking-wide">Payment Method</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMethod(m.id);
                    setDetail("");
                    setError("");
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border bg-surface hover:border-primary/50",
                  )}
                >
                  <Icon className={cn("mt-0.5 size-5", active ? "text-primary" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            {method === "upi" ? (
              <>
                <Label htmlFor="pay-detail">UPI ID</Label>
                <Input
                  id="pay-detail"
                  placeholder="name@bank"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
              </>
            ) : null}
            {method === "card" ? (
              <>
                <Label htmlFor="pay-detail">Card number</Label>
                <Input
                  id="pay-detail"
                  inputMode="numeric"
                  placeholder="4111 1111 1111 1111"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
              </>
            ) : null}
            {method === "netbanking" ? (
              <>
                <Label htmlFor="pay-detail">Bank</Label>
                <Input
                  id="pay-detail"
                  placeholder="HDFC Bank"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
              </>
            ) : null}
            {method === "wallet" ? (
              <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                CineVerse wallet balance: <strong className="text-primary">{formatINR(5000)}</strong>{" "}
                — enough for this booking.
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Simulated secure
            payment. Your seats are locked the moment payment succeeds.
          </p>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <SummaryPanel
            movieTitle={show.movie.title}
            date={show.show_date}
            time={show.show_time}
            screen={show.screen.name}
            seats={seats}
            basePrice={show.base_price}
          >
            <Button size="lg" className="w-full" disabled={paying} onClick={() => void pay()}>
              {paying ? <Loader2 className="size-4 animate-spin" /> : null}
              {paying ? "Processing payment…" : `Pay ${formatINR(price.total)}`}
            </Button>
            <Button asChild variant="ghost" className="w-full" disabled={paying}>
              <Link to="/book/$showId" params={{ showId }}>
                Change seats
              </Link>
            </Button>
          </SummaryPanel>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, showId }: { title: string; text: string; showId: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl tracking-wide">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-8">
        <Link to="/book/$showId" params={{ showId }}>
          Choose seats
        </Link>
      </Button>
    </div>
  );
}
