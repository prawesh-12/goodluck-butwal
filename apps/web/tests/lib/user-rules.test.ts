import { test, expect } from "vitest";
import { refusalReason, THIRD_ADMIN_PHRASE } from "@/lib/auth/user-rules";

const base = {
  actorId: "boss",
  targetId: "someone",
  targetWasAdmin: false,
  targetWasActive: true,
  nextRole: "member" as const,
  nextActive: true,
  activeAdmins: 2,
};

test("an ordinary change is allowed", () => {
  expect(refusalReason({ ...base, nextActive: false })).toBe(null);
});

test("you cannot demote yourself", () => {
  const r = refusalReason({ ...base, targetId: "boss", targetWasAdmin: true, nextRole: "member" });
  expect(r).toContain("your own role");
});

test("you cannot deactivate yourself", () => {
  const r = refusalReason({ ...base, targetId: "boss", targetWasAdmin: true, nextRole: "admin", nextActive: false });
  expect(r).toContain("your own account");
});

test("the last active admin cannot be demoted", () => {
  const r = refusalReason({ ...base, targetWasAdmin: true, nextRole: "member", activeAdmins: 1 });
  expect(r).toContain("one active admin");
});

test("the last active admin cannot be deactivated", () => {
  const r = refusalReason({ ...base, targetWasAdmin: true, nextRole: "admin", nextActive: false, activeAdmins: 1 });
  expect(r).toContain("one active admin");
});

test("a second admin needs no confirmation", () => {
  expect(refusalReason({ ...base, nextRole: "admin", activeAdmins: 1 })).toBe(null);
});

test("a third admin is refused without the typed phrase", () => {
  const r = refusalReason({ ...base, nextRole: "admin", activeAdmins: 2 });
  expect(r).toContain(THIRD_ADMIN_PHRASE);
});

test("a third admin goes through once the phrase is typed", () => {
  const r = refusalReason({ ...base, nextRole: "admin", activeAdmins: 2, confirmation: "  Add A Third Admin  " });
  expect(r).toBe(null);
});

test("editing an admin who stays one does not count as gaining another", () => {
  const r = refusalReason({ ...base, targetWasAdmin: true, nextRole: "admin", activeAdmins: 2 });
  expect(r).toBe(null);
});

test("reactivating a deactivated admin when two are active needs the phrase", () => {
  const r = refusalReason({ ...base, targetWasAdmin: true, targetWasActive: false, nextRole: "admin", activeAdmins: 2 });
  expect(r).toContain(THIRD_ADMIN_PHRASE);
});
