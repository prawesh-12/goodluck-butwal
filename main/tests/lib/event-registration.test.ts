import { test, expect } from "vitest";
import {
  ALREADY_REGISTERED,
  EVENT_FULL,
  REGISTRATION_CLOSED,
  insertOutcome,
  registrationRefusal,
} from "@/lib/validators/event";

const now = new Date("2026-05-01T00:00:00Z");

const base = {
  registrationEnabled: true,
  registrationDeadline: new Date("2026-05-10T00:00:00Z"),
  startsAt: new Date("2026-05-12T00:00:00Z"),
  capacity: 50,
  seatsTaken: 10,
  attendees: 1,
};

test("a registration before the deadline is allowed", () => {
  expect(registrationRefusal(base, now)).toBe(null);
});

test("a registration past the deadline is refused with the deadline message", () => {
  const late = new Date("2026-05-11T00:00:00Z");
  expect(registrationRefusal(base, late)).toBe(REGISTRATION_CLOSED);
});

test("a registration at capacity is refused with the capacity message", () => {
  expect(registrationRefusal({ ...base, seatsTaken: 50 }, now)).toBe(EVENT_FULL);
});

test("the deadline message and the capacity message are different", () => {
  expect(REGISTRATION_CLOSED).not.toBe(EVENT_FULL);
});

test("a party larger than the seats left is refused with the capacity message", () => {
  expect(registrationRefusal({ ...base, seatsTaken: 48, attendees: 3 }, now)).toBe(EVENT_FULL);
  expect(registrationRefusal({ ...base, seatsTaken: 48, attendees: 2 }, now)).toBe(null);
});

test("a duplicate email gives the already registered message", () => {
  const outcome = insertOutcome([]);
  expect(outcome.ok).toBe(false);
  expect(outcome.ok === false && outcome.error).toBe(ALREADY_REGISTERED);
});

test("a first registration is accepted", () => {
  expect(insertOutcome([{ id: "row" }]).ok).toBe(true);
});

test("a capacity of null means unlimited", () => {
  expect(registrationRefusal({ ...base, capacity: null, seatsTaken: 9999 }, now)).toBe(null);
});

test("registration closes at the start time when no deadline is set", () => {
  const gate = { ...base, registrationDeadline: null };
  expect(registrationRefusal(gate, now)).toBe(null);
  expect(registrationRefusal(gate, new Date("2026-05-13T00:00:00Z"))).toBe(REGISTRATION_CLOSED);
});
