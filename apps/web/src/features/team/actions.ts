"use server";

import { revalidatePath } from "next/cache";
import { TAGS, invalidate, revalidateSitemap } from "@/lib/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@goodluck/db";
import { redirects, teamMembers } from "@goodluck/db/schema";
import { requireActor } from "@/lib/auth/session";
import { can, requireOwnership, requirePermission, type Actor } from "@/lib/auth/rbac";
import { sanitize } from "@/lib/security/sanitize";
import { uniqueSlug } from "@/lib/utils/slug";
import {
  createTeamMemberSchema,
  reorderTeamSchema,
  teamPublishProblems,
  updateTeamMemberSchema,
  type TeamMemberInput,
} from "@/features/team/validators";
import { mediaAlt } from "@/features/media/admin-queries";
import { teamSlugs } from "@/features/team/admin-queries";

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
  const alt = await mediaAlt([data.photoId]);
  const problems = teamPublishProblems(data, { photo: alt.get(data.photoId) });
  return problems.length > 0 ? `Not ready to publish. Add: ${problems.join(", ")}.` : null;
}

// The rest of the site only carries a face, which the layout's own 300s revalidate catches.
function refresh(slugs: string[]) {
  invalidate(TAGS.team);
  revalidateSitemap();
  revalidatePath("/admin/team");
  revalidatePath("/about/team");
  revalidatePath("/about");
  revalidatePath("/");
  for (const slug of slugs) revalidatePath(`/team/${slug}`);
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
    .returning({ id: teamMembers.id, slug: teamMembers.slug });

  refresh([created.slug]);
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

  refresh([slug, existing.slug]);
  return { ok: true, data: { id: data.id } };
}

export async function deleteTeamMember(input: unknown): Promise<Result<{ id: string }>> {
  const actor = await requireActor();
  requirePermission(actor, "team", "delete");

  const parsed = updateTeamMemberSchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That person could not be found." };

  const [existing] = await db
    .select({ id: teamMembers.id, slug: teamMembers.slug, officeId: teamMembers.officeId })
    .from(teamMembers)
    .where(eq(teamMembers.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That person is no longer in the team list." };

  requireOwnership(actor, existing);

  await db.delete(teamMembers).where(eq(teamMembers.id, existing.id));

  refresh([existing.slug]);
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

  refresh([]);
  return { ok: true, data: { moved: ids.length } };
}
