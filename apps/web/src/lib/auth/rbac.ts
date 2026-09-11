import { eq, isNull, or, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

export type UserRole = "admin" | "member";
export type Action = "create" | "read" | "update" | "delete" | "publish" | "export";

export type Actor = {
  id: string;
  role: UserRole;
  officeId: string | null;
  isActive: boolean;
};

export type Entity =
  | "team"
  | "partners"
  | "institutions"
  | "courses"
  | "courseCategories"
  | "testPrep"
  | "batches"
  | "posts"
  | "events"
  | "postCategories"
  | "tags"
  | "enquiries"
  | "consultations"
  | "registrations"
  | "media"
  | "users";

const CRUD: Action[] = ["create", "read", "update", "delete"];
const CRUDP: Action[] = [...CRUD, "publish"];
const HANDLE: Action[] = ["read", "update", "export"];
const NONE: Action[] = [];

const both = (actions: Action[]): Record<UserRole, Action[]> => ({ admin: actions, member: actions });

// A member does everything an admin does except manage users. Nothing else in the app decides who
// may do what. "own" scoping lives in scopedWhere and requireOwnership, not here.
const MATRIX: Record<Entity, Record<UserRole, Action[]>> = {
  team: both(CRUDP),
  partners: both(CRUDP),
  institutions: both(CRUDP),
  courses: both(CRUDP),
  courseCategories: both(CRUD),
  testPrep: both(CRUDP),
  batches: both(CRUDP),
  posts: both(CRUDP),
  events: both(CRUDP),
  postCategories: both(CRUD),
  tags: both(CRUD),
  enquiries: both(HANDLE),
  consultations: both(HANDLE),
  registrations: both(HANDLE),
  media: both(CRUD),
  users: { admin: CRUD, member: NONE },
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

// Admins and members with no office see everything. A member with an office is pinned to that
// office plus office-less rows. Never compare office_id anywhere else.
export const seesAllOffices = (user: Actor) => user.role === "admin" || !user.officeId;

export function scopedWhere(
  table: PgTable & { officeId: AnyPgColumn },
  user: Actor,
): SQL | undefined {
  if (seesAllOffices(user)) return undefined;
  return or(eq(table.officeId, user.officeId!), isNull(table.officeId));
}

// Rule 3: check the row that came back from the database, never the id that came from the form.
export function requireOwnership(user: Actor, row: { officeId: string | null }): void {
  if (seesAllOffices(user)) return;
  if (row.officeId === null) return;
  if (row.officeId !== user.officeId) {
    throw new ForbiddenError("that record belongs to another office");
  }
}
