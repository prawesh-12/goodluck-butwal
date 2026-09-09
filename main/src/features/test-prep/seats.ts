export type BatchStatus = "open" | "filling_fast" | "full" | "closed" | "completed";
export type SeatLabel = "Open" | "Filling fast" | "Full" | "Closed" | "Completed";

export type Seats = { totalSeats: number; seatsTaken: number; status: BatchStatus };

export function seatsRemaining(totalSeats: number, seatsTaken: number) {
  return totalSeats - seatsTaken;
}

// The status column overrides the count. "open" is the one value that lets the count speak.
const OVERRIDE: Partial<Record<BatchStatus, SeatLabel>> = {
  filling_fast: "Filling fast",
  full: "Full",
  closed: "Closed",
  completed: "Completed",
};

export function seatLabel(batch: Seats): SeatLabel {
  const override = OVERRIDE[batch.status];
  if (override) return override;

  const remaining = seatsRemaining(batch.totalSeats, batch.seatsTaken);
  if (remaining <= 0) return "Full";
  if (remaining <= 3) return "Filling fast";
  return "Open";
}

export const BATCH_FULL = "That batch is full. Pick another batch and we will hold you a seat.";
export const BATCH_CLOSED = "That batch has closed for registrations. Pick another batch.";
export const BATCH_FINISHED = "That batch has already finished. Pick an upcoming one.";

// Count before status, so a batch marked "filling fast" with no seats left cannot be booked.
export function registrationRefusal(batch: Seats): string | null {
  if (seatsRemaining(batch.totalSeats, batch.seatsTaken) <= 0) return BATCH_FULL;
  if (batch.status === "full") return BATCH_FULL;
  if (batch.status === "closed") return BATCH_CLOSED;
  if (batch.status === "completed") return BATCH_FINISHED;
  return null;
}
