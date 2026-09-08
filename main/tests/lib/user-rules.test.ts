import { test, expect } from "vitest";
import { refusalReason, THIRD_SUPER_ADMIN_PHRASE } from "@/lib/user-rules";

const base = {
  actorId: "boss",
  targetId: "someone",
  targetWasSuperAdmin: false,
  targetWasActive: true,
  nextRole: "content_editor" as const,
  nextActive: true,
  activeSuperAdmins: 2,
};

test("an ordinary role change is allowed", () => {
  expect(refusalReason({ ...base, nextRole: "au_admin" })).toBe(null);
});

test("you cannot demote yourself", () => {
  const r = refusalReason({
    ...base,
    targetId: "boss",
    targetWasSuperAdmin: true,
    nextRole: "au_admin",
  });
  expect(r).toContain("your own role");
});

test("you cannot deactivate yourself", () => {
  const r = refusalReason({
    ...base,
    targetId: "boss",
    targetWasSuperAdmin: true,
    nextRole: "super_admin",
    nextActive: false,
  });
  expect(r).toContain("your own account");
});

test("the last active super admin cannot be demoted", () => {
  const r = refusalReason({
    ...base,
    targetWasSuperAdmin: true,
    nextRole: "au_admin",
    activeSuperAdmins: 1,
  });
  expect(r).toContain("one active super admin");
});

test("the last active super admin cannot be deactivated", () => {
  const r = refusalReason({
    ...base,
    targetWasSuperAdmin: true,
    nextRole: "super_admin",
    nextActive: false,
    activeSuperAdmins: 1,
  });
  expect(r).toContain("one active super admin");
});

test("a second super admin needs no confirmation", () => {
  expect(refusalReason({ ...base, nextRole: "super_admin", activeSuperAdmins: 1 })).toBe(null);
});

test("a third super admin is refused without the typed phrase", () => {
  const r = refusalReason({ ...base, nextRole: "super_admin", activeSuperAdmins: 2 });
  expect(r).toContain(THIRD_SUPER_ADMIN_PHRASE);
});

test("a third super admin goes through once the phrase is typed", () => {
  const r = refusalReason({
    ...base,
    nextRole: "super_admin",
    activeSuperAdmins: 2,
    confirmation: "  Add A Third Super Admin  ",
  });
  expect(r).toBe(null);
});

test("editing a super admin who stays one does not count as gaining another", () => {
  const r = refusalReason({
    ...base,
    targetWasSuperAdmin: true,
    nextRole: "super_admin",
    activeSuperAdmins: 2,
  });
  expect(r).toBe(null);
});

test("reactivating a deactivated super admin when two are active needs the phrase", () => {
  const r = refusalReason({
    ...base,
    targetWasSuperAdmin: true,
    targetWasActive: false,
    nextRole: "super_admin",
    activeSuperAdmins: 2,
  });
  expect(r).toContain(THIRD_SUPER_ADMIN_PHRASE);
});
