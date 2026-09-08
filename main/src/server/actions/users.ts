"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@db/client";
import { users } from "@db/schema";
import { auth, requireActor } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { refusalReason } from "@/lib/user-rules";
import { createUserSchema, updateUserSchema } from "@/lib/validators/user";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function countActiveSuperAdmins(exceptId?: string) {
  const where = exceptId
    ? and(eq(users.role, "super_admin"), eq(users.isActive, true), ne(users.id, exceptId))
    : and(eq(users.role, "super_admin"), eq(users.isActive, true));
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
    targetWasSuperAdmin: false,
    targetWasActive: false,
    nextRole: data.role,
    nextActive: true,
    activeSuperAdmins: await countActiveSuperAdmins(),
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

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "users",
    entityId: created.user.id,
    summary: `created ${data.email} as ${data.role}`,
  });

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
    .select({ id: users.id, role: users.role, isActive: users.isActive, email: users.email })
    .from(users)
    .where(eq(users.id, data.id));
  if (!existing) return { ok: false, error: "That account no longer exists." };

  const others = await countActiveSuperAdmins(existing.id);
  const refusal = refusalReason({
    actorId: actor.id,
    targetId: existing.id,
    targetWasSuperAdmin: existing.role === "super_admin",
    targetWasActive: existing.isActive,
    nextRole: data.role,
    nextActive: data.isActive,
    activeSuperAdmins: others + (existing.role === "super_admin" && existing.isActive ? 1 : 0),
    confirmation: data.confirmation,
  });
  if (refusal) return { ok: false, error: refusal };

  await db
    .update(users)
    .set({ name: data.name, role: data.role, officeId: data.officeId, isActive: data.isActive, updatedAt: new Date() })
    .where(eq(users.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "users",
    entityId: data.id,
    summary: `${existing.email} is now ${data.role}${data.isActive ? "" : ", deactivated"}`,
  });

  revalidatePath("/admin/users");
  return { ok: true, data: { id: data.id } };
}
