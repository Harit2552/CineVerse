export type SeatType = "regular" | "premium" | "vip";

export type SeatRow = {
  row: string;
  type: SeatType;
  seats: string[];
};

const ROW_PLAN: { row: string; count: number; type: SeatType }[] = [
  { row: "A", count: 12, type: "regular" },
  { row: "B", count: 12, type: "regular" },
  { row: "C", count: 12, type: "regular" },
  { row: "D", count: 12, type: "premium" },
  { row: "E", count: 12, type: "premium" },
  { row: "F", count: 12, type: "premium" },
  { row: "G", count: 8, type: "vip" },
  { row: "H", count: 8, type: "vip" },
];

export const SEAT_LAYOUT: SeatRow[] = ROW_PLAN.map(({ row, count, type }) => ({
  row,
  type,
  seats: Array.from({ length: count }, (_, i) => `${row}${i + 1}`),
}));

export const TOTAL_SEATS = SEAT_LAYOUT.reduce((sum, r) => sum + r.seats.length, 0);

export const SEAT_TYPE_LABEL: Record<SeatType, string> = {
  regular: "Regular",
  premium: "Premium",
  vip: "VIP Recliner",
};

const MULTIPLIER: Record<SeatType, number> = { regular: 1, premium: 1.4, vip: 1.8 };

export function seatTypeOf(seatId: string): SeatType {
  const row = seatId.charAt(0).toUpperCase();
  return SEAT_LAYOUT.find((r) => r.row === row)?.type ?? "regular";
}

export function seatPrice(basePrice: number, type: SeatType): number {
  return Math.round((basePrice * MULTIPLIER[type]) / 10) * 10;
}

export type PriceBreakdown = {
  ticketTotal: number;
  convenienceFee: number;
  taxes: number;
  total: number;
};

export function priceBreakdown(basePrice: number, seats: string[]): PriceBreakdown {
  const ticketTotal = seats.reduce((sum, s) => sum + seatPrice(basePrice, seatTypeOf(s)), 0);
  const convenienceFee = Math.round(ticketTotal * 0.1);
  const taxes = Math.round(ticketTotal * 0.18);
  return { ticketTotal, convenienceFee, taxes, total: ticketTotal + convenienceFee + taxes };
}

/** Split a row into blocks so aisles fall in the natural places. */
export function seatBlocks(seats: string[]): string[][] {
  if (seats.length <= 8) return [seats.slice(0, 2), seats.slice(2, 6), seats.slice(6)];
  return [seats.slice(0, 2), seats.slice(2, seats.length - 2), seats.slice(seats.length - 2)];
}

export function formatINR(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
}

/** "19:30:00" -> "7:30 PM" */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${suffix}`;
}

/** "2026-09-19" -> "Friday, 19 September" */
export function formatLongDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export function formatShortDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function todayISO(): string {
  const now = new Date();
  const tz = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function nextDays(count: number, from: string = todayISO()): string[] {
  const start = new Date(`${from}T00:00:00`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function dayParts(date: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${date}T00:00:00`);
  return {
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
    day: String(d.getDate()),
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
  };
}

export function runtime(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
