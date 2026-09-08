"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@db/client";
import { redirects, teamMembers } from "@db/schema";
import { requireActor } from "@/lib/session";
import { can, requireOwnership, requirePermission, type Actor } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import { uniqueSlug } from "@/lib/slug";
import {
  createTeamMemberSchema,
  reorderTeamSchema,
  teamPublishProblems,
  updateTeamMemberSchema,
  type TeamMemberInput,
} from "@/lib/validators/team";
import { altTextByIds, teamSlugs } from "@/server/queries/admin-people";

type Result<T = { id: string }> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const blank = (value: string) => (value === "" ? null : value);

// An office admin can only ever file a person under their own office.
function officeFor(actor: Actor, chosen: string) {
  return actor.role === "super_admin" ? blank(chosen) : actor.officeId;
}

async function publishRefusal(data: TeamMemberInput) {
  if (data.status !== "published") return null;
  const alt = await altTextByIds([data.photoId, data.seoOgImageId]);
  const problems = teamPublishProblems(data, {
    photo: alt.get(data.photoId),
    shareImage: alt.get(data.seoOgImageId),
  });
  return problems.length > 0 ? `Not ready to publish. Add: ${problems.join(", ")}.` : null;
}

function columns(data: TeamMemberInput, officeId: string | null) {
  return {
    officeId,
    fullName: data.fullName,
    position: blank(data.position),
    photoId: blank(data.photoId),
    bioHtml: blank(sanitize(data.bioHtml)),
    qualifications: data.qualifications,
    expertise: data.expertise,
    email: blank(data.email),
    phone: blank(data.phone),
    linkedinUrl: blank(data.linkedinUrl),
    isCoFounder: data.isCoFounder,
    isFeatured: data.isFeatured,
    status: data.status,
    seoTitle: blank(data.seoTitle),
    seoDescription: blank(data.seoDescription),
    seoOgImageId: blank(data.seoOgImageId),
    seoNoindex: data.seoNoindex,
    canonicalUrl: blank(data.canonicalUrl),
  };
}

export async function createTeamMember(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "team", "create");

  const parsed = createTeamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (data.status === "published" && !can(actor, "team", "publish")) {
    return { ok: false, error: "Your role can save this person but not publish them." };
  }
  const refusal = await publishRefusal(data);
  if (refusal) return { ok: false, error: refusal };

  const slug = uniqueSlug(data.slug || data.fullName, await teamSlugs());

  const [created] = await db
    .insert(teamMembers)
    .values({
      ...columns(data, officeFor(actor, data.officeId)),
      slug,
      publishedAt: data.status === "published" ? new Date() : null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: teamMembers.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "team_members",
    entityId: created.id,
    summary: `added ${data.fullName}`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/about/team");
  return { ok: true, data: { id: created.id } };
}

export async function updateTeamMember(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "team", "update");

  const parsed = updateTeamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({
      id: teamMembers.id,
      officeId: teamMembers.officeId,
      slug: teamMembers.slug,
      fullName: teamMembers.fullName,
      status: teamMembers.status,
      publishedAt: teamMembers.publishedAt,
    })
    .from(teamMembers)
    .where(eq(teamMembers.id, data.id));
  if (!existing) return { ok: false, error: "That person is no longer in the team list." };

  requireOwnership(actor, existing);

  if (data.status !== existing.status && !can(actor, "team", "publish")) {
    return { ok: false, error: "Your role can save this person but not change whether they are published." };
  }
  const refusal = await publishRefusal(data);
  if (refusal) return { ok: false, error: refusal };

  const office = officeFor(actor, data.officeId);
  // A move to another office needs rights over the office it is going to, as well as this one.
  requireOwnership(actor, { officeId: office });

  const slug = data.slug
    ? uniqueSlug(data.slug, (await teamSlugs()).filter((s) => s !== existing.slug))
    : existing.slug;

  await db
    .update(teamMembers)
    .set({
      ...columns(data, office),
      slug,
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : null,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(teamMembers.id, data.id));

  if (existing.slug !== slug && existing.status === "published") {
    const to = `/team/${slug}`;
    await db
      .insert(redirects)
      .values({
        fromPath: `/team/${existing.slug}`,
        toPath: to,
        note: `${existing.fullName} was renamed`,
        createdBy: actor.id,
      })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: to, isActive: true, updatedBy: actor.id, updatedAt: new Date() },
      });
  }

  await writeAudit({
    userId: actor.id,
    action:
      data.status === existing.status ? "update" : data.status === "published" ? "publish" : "unpublish",
    entityType: "team_members",
    entityId: data.id,
    summary: `${data.fullName} updated`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/about/team");
  return { ok: true, data: { id: data.id } };
}

export async function deleteTeamMember(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "team", "delete");

  const parsed = updateTeamMemberSchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That person could not be found." };

  const [existing] = await db
    .select({ id: teamMembers.id, officeId: teamMembers.officeId, fullName: teamMembers.fullName })
    .from(teamMembers)
    .where(eq(teamMembers.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That person is no longer in the team list." };

  requireOwnership(actor, existing);

  await db.delete(teamMembers).where(eq(teamMembers.id, existing.id));

  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "team_members",
    entityId: existing.id,
    summary: `removed ${existing.fullName}`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/about/team");
  return { ok: true, data: { id: existing.id } };
}

export async function reorderTeam(input: unknown): Promise<Result<{ moved: number }>> {
  const actor = await requireActor();
  requirePermission(actor, "team", "update");

  const parsed = reorderTeamSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That order could not be read." };
  const { ids } = parsed.data;

  const rows = await db
    .select({ id: teamMembers.id, officeId: teamMembers.officeId })
    .from(teamMembers)
    .where(inArray(teamMembers.id, ids));
  if (rows.length !== ids.length) return { ok: false, error: "The list changed. Reload and try again." };
  for (const row of rows) requireOwnership(actor, row);

  for (const [index, id] of ids.entries()) {
    await db
      .update(teamMembers)
      .set({ sortOrder: index, updatedBy: actor.id, updatedAt: new Date() })
      .where(eq(teamMembers.id, id));
  }

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "team_members",
    summary: `reordered ${ids.length} team members`,
  });

  revalidatePath("/admin/team");
  revalidatePath("/about/team");
  return { ok: true, data: { moved: ids.length } };
}
