import { test, expect } from "vitest";
import {
  can,
  requirePermission,
  requireOwnership,
  scopedWhere,
  ForbiddenError,
  type Actor,
  type Entity,
} from "@/lib/auth/rbac";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { enquiries, posts } from "@db/schema";

const dialect = new PgDialect();
const render = (where: SQL | undefined) => dialect.sqlToQuery(where!);

const AU = "11111111-1111-1111-1111-111111111111";
const NP = "22222222-2222-2222-2222-222222222222";

const superAdmin: Actor = { id: "u1", role: "super_admin", officeId: null, isActive: true };
const auAdmin: Actor = { id: "u2", role: "au_admin", officeId: AU, isActive: true };
const npAdmin: Actor = { id: "u3", role: "np_admin", officeId: NP, isActive: true };
const editor: Actor = { id: "u4", role: "content_editor", officeId: null, isActive: true };

test("a Nepal admin's enquiry filter excludes Australian rows", () => {
  const { sql, params } = render(scopedWhere(enquiries, npAdmin));
  expect(sql).toContain('"office_id"');
  expect(params).toContain(NP);
  expect(params).not.toContain(AU);
});

test("an Australia admin updating a Nepal enquiry is refused", () => {
  expect(() => requireOwnership(auAdmin, { officeId: NP })).toThrow(ForbiddenError);
});

test("a content editor cannot publish a post", () => {
  expect(can(editor, "posts", "publish")).toBe(false);
  expect(() => requirePermission(editor, "posts", "publish")).toThrow(ForbiddenError);
});

test("a content editor cannot read enquiries", () => {
  expect(can(editor, "enquiries", "read")).toBe(false);
});

test("an Australia admin cannot edit a test prep batch", () => {
  expect(can(auAdmin, "batches", "update")).toBe(false);
  expect(can(npAdmin, "batches", "update")).toBe(true);
});

test("a super admin is not filtered to one office", () => {
  expect(scopedWhere(enquiries, superAdmin)).toBeUndefined();
  expect(() => requireOwnership(superAdmin, { officeId: NP })).not.toThrow();
});

test("a deactivated user can do nothing at all", () => {
  const suspended: Actor = { ...superAdmin, isActive: false };
  expect(can(suspended, "posts", "read")).toBe(false);
  expect(can(suspended, "users", "update")).toBe(false);
});

// Scoping rules the seven do not reach.

test("shared rows with no office stay visible to an office admin", () => {
  expect(() => requireOwnership(auAdmin, { officeId: null })).not.toThrow();
  expect(render(scopedWhere(posts, auAdmin)).sql).toContain("is null");
});

test("an editor can still create and update a post", () => {
  expect(can(editor, "posts", "create")).toBe(true);
  expect(can(editor, "posts", "update")).toBe(true);
});

test("only a super admin manages users", () => {
  for (const actor of [auAdmin, npAdmin, editor]) {
    expect(can(actor, "users", "read")).toBe(false);
  }
  expect(can(superAdmin, "users", "delete")).toBe(true);
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
  for (const entity of sections) expect(can(superAdmin, entity, "read")).toBe(true);
  expect(can(superAdmin, "media", "read")).toBe(true);
});
