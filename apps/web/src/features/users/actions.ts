"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@goodluck/db";
import { users } from "@goodluck/db/schema";
// The only place outside the auth route needing the full server: creating an account hashes.
import { auth } from "@/lib/auth";
import { requireActor } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/rbac";
import { refusalReason } from "@/lib/auth/user-rules";
import { createUserSchema, updateUserSchema } from "@/features/users/validators";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function countActiveAdmins(exceptId?: string) {
  const where = exceptId
    ? and(eq(users.role, "admin"), eq(users.isActive, true), ne(users.id, exceptId))
    : and(eq(users.role, "admin"), eq(users.isActive, true));
  const [row] = await db.select({ n: count() }).from(users).where(where);
  return row.n;
}

export async function createUser(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "users", "create");

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const refusal = refusalReason({
    actorId: actor.id,
    targetId: "new",
    targetWasAdmin: false,
    targetWasActive: false,
    nextRole: data.role,
    nextActive: true,
    activeAdmins: await countActiveAdmins(),
    confirmation: data.confirmation,
  });
  if (refusal) return { ok: false, error: refusal };

  const created = await auth.api.signUpEmail({
    body: { name: data.name, email: data.email, password: data.password },
  });
  if (!created?.user) return { ok: false, error: "That account could not be created." };

  await db
    .update(users)
    .set({ role: data.role, officeId: data.officeId, updatedAt: new Date() })
    .where(eq(users.id, created.user.id));

  revalidatePath("/admin/users");
  return { ok: true, data: { id: created.user.id } };
}

export async function updateUser(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "users", "update");

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, data.id));
  if (!existing) return { ok: false, error: "That account no longer exists." };

  const others = await countActiveAdmins(existing.id);
  const refusal = refusalReason({
    actorId: actor.id,
    targetId: existing.id,
    targetWasAdmin: existing.role === "admin",
    targetWasActive: existing.isActive,
    nextRole: data.role,
    nextActive: data.isActive,
    activeAdmins: others + (existing.role === "admin" && existing.isActive ? 1 : 0),
    confirmation: data.confirmation,
  });
  if (refusal) return { ok: false, error: refusal };

  await db
    .update(users)
    .set({ name: data.name, role: data.role, officeId: data.officeId, isActive: data.isActive, updatedAt: new Date() })
    .where(eq(users.id, data.id));

  revalidatePath("/admin/users");
  return { ok: true, data: { id: data.id } };
}
