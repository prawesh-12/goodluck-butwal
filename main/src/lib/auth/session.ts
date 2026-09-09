import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@db/client";
import { sessions, users } from "@db/schema";
import type { Actor, UserRole } from "@/lib/auth/rbac";

// Does not import lib/auth: that copies the whole Better Auth server into every admin route
// chunk. Only /api/auth/[...all] builds it.
// The cookie signature is not checked here. The token is a random secret looked up in the
// database, so a forged one matches no row and the lookup is what decides.
const COOKIE = "better-auth.session_token";
const SECURE_COOKIE = `__Secure-${COOKIE}`;

async function currentActor(): Promise<Actor | null> {
  const jar = await cookies();
  const raw = jar.get(SECURE_COOKIE)?.value ?? jar.get(COOKIE)?.value;
  if (!raw) return null;

  const token = decodeURIComponent(raw).split(".")[0];
  if (!token) return null;

  const [row] = await db
    .select({
      id: users.id,
      role: users.role,
      officeId: users.officeId,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

  if (!row?.isActive) return null;
  return { id: row.id, role: row.role as UserRole, officeId: row.officeId, isActive: row.isActive };
}

export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect("/admin/login");
  return actor;
}

export async function currentUserName(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(SECURE_COOKIE)?.value ?? jar.get(COOKIE)?.value;
  if (!raw) return null;

  const token = decodeURIComponent(raw).split(".")[0];
  const [row] = await db
    .select({ name: users.name })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

  return row?.name ?? null;
}
