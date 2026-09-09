import { eq, isNull, or, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

export type UserRole = "super_admin" | "au_admin" | "np_admin" | "content_editor";
export type Action = "create" | "read" | "update" | "delete" | "publish" | "export";

export type Actor = {
  id: string;
  role: UserRole;
  officeId: string | null;
  isActive: boolean;
};

export type Entity =
  | "offices"
  | "team"
  | "partners"
  | "pages"
  | "uiStrings"
  | "destinations"
  | "institutions"
  | "courses"
  | "services"
  | "courseCategories"
  | "testPrep"
  | "batches"
  | "posts"
  | "events"
  | "testimonials"
  | "postCategories"
  | "tags"
  | "enquiries"
  | "consultations"
  | "registrations"
  | "media"
  | "redirects"
  | "users"
  | "settings"
  | "auditLog";

const CRUD: Action[] = ["create", "read", "update", "delete"];
const CRUDP: Action[] = [...CRUD, "publish"];
const CRU: Action[] = ["create", "read", "update"];
const NONE: Action[] = [];

// The permission matrix, as data. Nothing else in the app decides who may do what.
// "own" scoping is not expressed here, scopedWhere and requireOwnership handle it.
const MATRIX: Record<Entity, Record<UserRole, Action[]>> = {
  offices: { super_admin: CRUDP, au_admin: ["read", "update"], np_admin: ["read", "update"], content_editor: NONE },
  team: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  partners: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  pages: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  uiStrings: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  destinations: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  institutions: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  courses: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  services: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: NONE },
  courseCategories: { super_admin: CRUD, au_admin: ["read"], np_admin: ["read"], content_editor: NONE },
  testPrep: { super_admin: CRUDP, au_admin: ["read"], np_admin: CRUDP, content_editor: NONE },
  batches: { super_admin: CRUDP, au_admin: ["read"], np_admin: CRUDP, content_editor: NONE },
  posts: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: CRU },
  events: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: CRU },
  testimonials: { super_admin: CRUDP, au_admin: CRUDP, np_admin: CRUDP, content_editor: CRU },
  postCategories: { super_admin: CRUD, au_admin: CRU, np_admin: CRU, content_editor: ["create", "read"] },
  tags: { super_admin: CRUD, au_admin: CRU, np_admin: CRU, content_editor: ["create", "read"] },
  enquiries: {
    super_admin: ["read", "update", "export"],
    au_admin: ["read", "update", "export"],
    np_admin: ["read", "update", "export"],
    content_editor: NONE,
  },
  consultations: {
    super_admin: ["read", "update", "export"],
    au_admin: ["read", "update", "export"],
    np_admin: ["read", "update", "export"],
    content_editor: NONE,
  },
  registrations: {
    super_admin: ["read", "update", "export"],
    au_admin: ["read", "update", "export"],
    np_admin: ["read", "update", "export"],
    content_editor: NONE,
  },
  media: { super_admin: CRUD, au_admin: CRUD, np_admin: CRUD, content_editor: CRU },
  redirects: { super_admin: CRUD, au_admin: NONE, np_admin: NONE, content_editor: NONE },
  users: { super_admin: CRUD, au_admin: NONE, np_admin: NONE, content_editor: NONE },
  settings: { super_admin: ["read", "update"], au_admin: ["read"], np_admin: ["read"], content_editor: NONE },
  auditLog: { super_admin: ["read"], au_admin: ["read"], np_admin: ["read"], content_editor: NONE },
};

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function can(user: Actor, entity: Entity, action: Action): boolean {
  if (!user.isActive) return false;
  return MATRIX[entity][user.role].includes(action);
}

export function requirePermission(user: Actor, entity: Entity, action: Action): void {
  if (!can(user, entity, action)) {
    throw new ForbiddenError(`${user.role} cannot ${action} ${entity}`);
  }
}

// Super admins have no office and see everything. Everyone else is pinned to theirs, plus rows
// that belong to no office because those are shared. Never compare office_id anywhere else.
export function scopedWhere(
  table: PgTable & { officeId: AnyPgColumn },
  user: Actor,
): SQL | undefined {
  if (user.role === "super_admin") return undefined;
  if (!user.officeId) return isNull(table.officeId);
  return or(eq(table.officeId, user.officeId), isNull(table.officeId));
}

// Rule 3: check the row that came back from the database, never the id that came from the form.
export function requireOwnership(user: Actor, row: { officeId: string | null }): void {
  if (user.role === "super_admin") return;
  if (row.officeId === null) return;
  if (row.officeId !== user.officeId) {
    throw new ForbiddenError("that record belongs to another office");
  }
}
