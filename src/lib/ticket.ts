import { buildMatrix } from "@/components/booking/QrTicketCode";

export type TicketData = {
  bookingCode: string;
  movie: string;
  date: string;
  time: string;
  screen: string;
  seats: string;
  amount: string;
};

/** Renders a cinema-style ticket to a PNG and triggers a download. */
export function downloadTicket(ticket: TicketData) {
  const width = 1000;
  const height = 420;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#12141b";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#f5b53d");
  gradient.addColorStop(1, "#d8582f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 10);

  ctx.fillStyle = "#f5b53d";
  ctx.font = "bold 34px Georgia, serif";
  ctx.fillText("CINEVERSE CINEMAS", 48, 80);

  ctx.fillStyle = "#9aa3b2";
  ctx.font = "16px Helvetica, Arial, sans-serif";
  ctx.fillText("Orion Mall, MG Road, Bengaluru", 48, 108);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Helvetica, Arial, sans-serif";
  ctx.fillText(ticket.movie, 48, 168);

  const rows: [string, string][] = [
    ["DATE", ticket.date],
    ["TIME", ticket.time],
    ["SCREEN", ticket.screen],
    ["SEATS", ticket.seats],
    ["AMOUNT", ticket.amount],
    ["BOOKING ID", ticket.bookingCode],
  ];

  rows.forEach(([label, value], i) => {
    const x = 48 + (i % 3) * 210;
    const y = 240 + Math.floor(i / 3) * 80;
    ctx.fillStyle = "#9aa3b2";
    ctx.font = "13px Helvetica, Arial, sans-serif";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Helvetica, Arial, sans-serif";
    ctx.fillText(value, x, y + 28);
  });

  // Perforation
  ctx.strokeStyle = "#2a2f3a";
  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.moveTo(710, 30);
  ctx.lineTo(710, height - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // QR
  const grid = buildMatrix(ticket.bookingCode);
  const pixel = 8;
  const qrSize = grid.length * pixel;
  const qrX = 760;
  const qrY = (height - qrSize) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
  ctx.fillStyle = "#0b0d12";
  grid.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) ctx.fillRect(qrX + x * pixel, qrY + y * pixel, pixel, pixel);
    }),
  );

  const link = document.createElement("a");
  link.download = `cineverse-${ticket.bookingCode}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
