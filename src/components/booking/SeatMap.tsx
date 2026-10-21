import { SEAT_LAYOUT, seatBlocks, SEAT_TYPE_LABEL, seatPrice, formatINR } from "@/lib/cinema";
import { cn } from "@/lib/utils";

type Props = {
  taken: string[];
  selected: string[];
  basePrice: number;
  onToggle: (seatId: string) => void;
};

export function SeatMap({ taken, selected, basePrice, onToggle }: Props) {
  const takenSet = new Set(taken);
  const selectedSet = new Set(selected);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="screen-arc h-6 w-full" aria-hidden="true" />
        <p className="mt-2 text-center font-display text-sm tracking-[0.5em] text-muted-foreground">
          SCREEN
        </p>
      </div>

      <div className="no-scrollbar mt-8 overflow-x-auto pb-2">
        <div className="mx-auto w-max space-y-2">
          {SEAT_LAYOUT.map((row) => (
            <div key={row.row} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-semibold text-muted-foreground">
                {row.row}
              </span>
              <div className="flex items-center gap-4">
                {seatBlocks(row.seats).map((block, blockIndex) => (
                  <div key={blockIndex} className="flex gap-1.5">
                    {block.map((seatId) => {
                      const isTaken = takenSet.has(seatId);
                      const isSelected = selectedSet.has(seatId);
                      return (
                        <button
                          key={seatId}
                          type="button"
                          disabled={isTaken}
                          onClick={() => onToggle(seatId)}
                          aria-pressed={isSelected}
                          aria-label={`Seat ${seatId}, ${SEAT_TYPE_LABEL[row.type]}, ${
                            isTaken ? "already booked" : formatINR(seatPrice(basePrice, row.type))
                          }`}
                          title={`${seatId} · ${SEAT_TYPE_LABEL[row.type]} · ${formatINR(
                            seatPrice(basePrice, row.type),
                          )}`}
                          className={cn(
                            "size-7 rounded-md border text-[10px] font-semibold transition-all duration-200 sm:size-8",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            isTaken &&
                              "cursor-not-allowed border-transparent bg-seat-booked text-muted-foreground opacity-60",
                            !isTaken &&
                              !isSelected &&
                              row.type === "regular" &&
                              "border-seat-available/60 bg-seat-available/15 text-seat-available hover:bg-seat-available/35",
                            !isTaken &&
                              !isSelected &&
                              row.type === "premium" &&
                              "border-seat-premium/60 bg-seat-premium/15 text-seat-premium hover:bg-seat-premium/35",
                            !isTaken &&
                              !isSelected &&
                              row.type === "vip" &&
                              "border-seat-vip/60 bg-seat-vip/15 text-seat-vip hover:bg-seat-vip/35",
                            isSelected &&
                              "scale-110 border-seat-selected bg-seat-selected text-background shadow-glow",
                          )}
                        >
                          {seatId.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <span className="w-5 text-center text-xs font-semibold text-muted-foreground">
                {row.row}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
        <Legend className="border-seat-available/60 bg-seat-available/25" label="Available" />
        <Legend className="bg-seat-selected" label="Selected" />
        <Legend className="bg-seat-booked" label="Booked" />
        <Legend className="border-seat-premium/60 bg-seat-premium/30" label="Premium" />
        <Legend className="border-seat-vip/60 bg-seat-vip/30" label="VIP recliner" />
      </ul>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Rows A–C {formatINR(seatPrice(basePrice, "regular"))} · Rows D–F{" "}
        {formatINR(seatPrice(basePrice, "premium"))} · Rows G–H{" "}
        {formatINR(seatPrice(basePrice, "vip"))}
      </p>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("size-4 rounded border border-transparent", className)} aria-hidden="true" />
      {label}
    </li>
  );
}
