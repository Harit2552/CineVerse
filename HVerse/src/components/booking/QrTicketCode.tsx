import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Deterministic QR-style matrix rendered from the booking payload. */
export function buildMatrix(value: string, size = 25): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  const rand = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };

  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => rand() > 0.52),
  );

  const finder = (top: number, left: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = y === 0 || y === 6 || x === 0 || x === 6;
        const core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        grid[top + y]![left + x] = edge || core;
      }
    }
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const gy = top + y;
        const gx = left + x;
        if (gy < 0 || gx < 0 || gy >= size || gx >= size) continue;
        if (y === -1 || y === 7 || x === -1 || x === 7) grid[gy]![gx] = false;
      }
    }
  };

  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  return grid;
}

export function QrTicketCode({
  value,
  className,
  pixel = 6,
}: {
  value: string;
  className?: string;
  pixel?: number;
}) {
  const grid = useMemo(() => buildMatrix(value), [value]);
  const size = grid.length * pixel;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Ticket QR code for ${value}`}
      className={cn("rounded-md bg-white p-1", className)}
    >
      <rect width={size} height={size} fill="#fff" />
      {grid.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * pixel}
              y={y * pixel}
              width={pixel}
              height={pixel}
              fill="#0b0d12"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
