import { test, expect } from "vitest";
import {
  BATCH_CLOSED,
  BATCH_FINISHED,
  BATCH_FULL,
  registrationRefusal,
  seatLabel,
  seatsRemaining,
  type BatchStatus,
} from "@/features/test-prep/seats";

const batch = (seatsTaken: number, totalSeats = 20, status: BatchStatus = "open") => ({
  totalSeats,
  seatsTaken,
  status,
});

test("seats remaining is the total less the seats taken", () => {
  expect(seatsRemaining(20, 4)).toBe(16);
});

test("no seats left reads Full", () => {
  expect(seatLabel(batch(20))).toBe("Full");
});

test("one seat left reads Filling fast", () => {
  expect(seatLabel(batch(19))).toBe("Filling fast");
});

test("three seats left reads Filling fast", () => {
  expect(seatLabel(batch(17))).toBe("Filling fast");
});

test("four seats left reads Open", () => {
  expect(seatLabel(batch(16))).toBe("Open");
});

test("an empty batch reads Open", () => {
  expect(seatLabel(batch(0))).toBe("Open");
});

test("an overbooked batch reads Full", () => {
  expect(seatLabel(batch(23))).toBe("Full");
});

test("status open lets the seat count speak", () => {
  expect(seatLabel(batch(20, 20, "open"))).toBe("Full");
  expect(seatLabel(batch(0, 20, "open"))).toBe("Open");
});

test("status filling_fast overrides an empty batch", () => {
  expect(seatLabel(batch(0, 20, "filling_fast"))).toBe("Filling fast");
});

test("status full overrides an empty batch", () => {
  expect(seatLabel(batch(0, 20, "full"))).toBe("Full");
});

test("status closed overrides an empty batch", () => {
  expect(seatLabel(batch(0, 20, "closed"))).toBe("Closed");
});

test("status completed overrides an empty batch", () => {
  expect(seatLabel(batch(0, 20, "completed"))).toBe("Completed");
});

test("a batch with seats left takes a registration", () => {
  expect(registrationRefusal(batch(4))).toBe(null);
});

test("the last seat still takes a registration", () => {
  expect(registrationRefusal(batch(19))).toBe(null);
});

test("a batch with no seats left is refused as full", () => {
  expect(registrationRefusal(batch(20))).toBe(BATCH_FULL);
});

test("a batch marked full is refused even with seats free", () => {
  expect(registrationRefusal(batch(0, 20, "full"))).toBe(BATCH_FULL);
});

test("a batch marked filling fast with no seats left is still refused", () => {
  expect(registrationRefusal(batch(20, 20, "filling_fast"))).toBe(BATCH_FULL);
});

test("a closed batch is refused with its own message", () => {
  expect(registrationRefusal(batch(0, 20, "closed"))).toBe(BATCH_CLOSED);
});

test("a finished batch is refused with its own message", () => {
  expect(registrationRefusal(batch(0, 20, "completed"))).toBe(BATCH_FINISHED);
});
