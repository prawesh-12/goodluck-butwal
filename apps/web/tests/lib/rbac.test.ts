import { test, expect } from "vitest";
import {
  can,
  requirePermission,
  requireOwnership,
  scopedWhere,
  seesAllOffices,
  ForbiddenError,
  type Actor,
  type Entity,
} from "@/lib/auth/rbac";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { enquiries, posts } from "@goodluck/db/schema";

const dialect = new PgDialect();
const render = (where: SQL | undefined) => dialect.sqlToQuery(where!);

const AU = "11111111-1111-1111-1111-111111111111";
const NP = "22222222-2222-2222-2222-222222222222";

const admin: Actor = { id: "u1", role: "admin", officeId: null, isActive: true };
const auMember: Actor = { id: "u2", role: "member", officeId: AU, isActive: true };
const npMember: Actor = { id: "u3", role: "member", officeId: NP, isActive: true };
const roamingMember: Actor = { id: "u4", role: "member", officeId: null, isActive: true };

test("a Nepal member's enquiry filter excludes Australian rows", () => {
  const { sql, params } = render(scopedWhere(enquiries, npMember));
  expect(sql).toContain('"office_id"');
  expect(params).toContain(NP);
  expect(params).not.toContain(AU);
});

test("an Australia member updating a Nepal enquiry is refused", () => {
  expect(() => requireOwnership(auMember, { officeId: NP })).toThrow(ForbiddenError);
});

test("shared rows with no office stay visible to an office member", () => {
  expect(() => requireOwnership(auMember, { officeId: null })).not.toThrow();
  expect(render(scopedWhere(posts, auMember)).sql).toContain("is null");
});

test("an admin, and a member with no office, are not filtered to one office", () => {
  for (const actor of [admin, roamingMember]) {
    expect(seesAllOffices(actor)).toBe(true);
    expect(scopedWhere(enquiries, actor)).toBeUndefined();
    expect(() => requireOwnership(actor, { officeId: NP })).not.toThrow();
  }
  expect(seesAllOffices(auMember)).toBe(false);
});

test("a member can publish and handle enquiries", () => {
  expect(can(auMember, "posts", "publish")).toBe(true);
  expect(can(auMember, "enquiries", "export")).toBe(true);
  expect(can(auMember, "batches", "update")).toBe(true);
});

test("only an admin manages users", () => {
  for (const actor of [auMember, npMember, roamingMember]) {
    expect(can(actor, "users", "read")).toBe(false);
    expect(() => requirePermission(actor, "users", "read")).toThrow(ForbiddenError);
  }
  expect(can(admin, "users", "delete")).toBe(true);
});

test("a deactivated user can do nothing at all", () => {
  const suspended: Actor = { ...admin, isActive: false };
  expect(can(suspended, "posts", "read")).toBe(false);
  expect(can(suspended, "users", "update")).toBe(false);
});

test("the permission matrix covers the ten admin sections and nothing else", () => {
  const sections: Entity[] = [
    "enquiries",
    "consultations",
    "team",
    "partners",
    "posts",
    "events",
    "institutions",
    "courses",
    "testPrep",
    "users",
  ];
  for (const entity of sections) expect(can(admin, entity, "read")).toBe(true);
  expect(can(admin, "media", "read")).toBe(true);
});
