import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@db/client";
import { offices, teamMembers } from "@db/schema";
import { scopedWhere, type Actor } from "@/lib/auth/rbac";
import { asStatus, PAGE_SIZE, type AdminFilters } from "@/lib/utils/admin-query";

function teamWhere(actor: Actor, f: AdminFilters) {
  const parts: (SQL | undefined)[] = [scopedWhere(teamMembers, actor)];

  if (f.q) {
    const like = `%${f.q}%`;
    parts.push(or(ilike(teamMembers.fullName, like), ilike(teamMembers.position, like)));
  }
  const status = asStatus(f.status);
  if (status) parts.push(eq(teamMembers.status, status));
  if (f.office) parts.push(eq(teamMembers.officeId, f.office));

  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export async function listAdminTeam(actor: Actor, f: AdminFilters) {
  const where = teamWhere(actor, f);
  const page = Math.max(1, f.page ?? 1);

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: teamMembers.id,
        slug: teamMembers.slug,
        fullName: teamMembers.fullName,
        position: teamMembers.position,
        status: teamMembers.status,
        sortOrder: teamMembers.sortOrder,
        officeId: teamMembers.officeId,
        office: offices.name,
      })
      .from(teamMembers)
      .leftJoin(offices, eq(teamMembers.officeId, offices.id))
      .where(where)
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.fullName))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(teamMembers).where(where),
  ]);

  return { rows, total: total.n, page };
}

export async function getAdminTeamMember(id: string) {
  const [row] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
  return row;
}

export async function teamSlugs() {
  const rows = await db.select({ slug: teamMembers.slug }).from(teamMembers);
  return rows.map((row) => row.slug);
}
