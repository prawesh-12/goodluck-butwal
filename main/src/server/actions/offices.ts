"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { offices, redirects } from "@db/schema";
import { requireActor } from "@/lib/auth";
import { can, requireOwnership, requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { sanitize } from "@/lib/sanitize";
import { officePublishProblems, updateOfficeSchema } from "@/lib/validators/office";
import { altTextByIds } from "@/server/queries/admin-people";

type Result =
  | { ok: true; data: { id: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const blank = (value: string) => (value === "" ? null : value);

export async function updateOffice(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "offices", "update");

  const parsed = updateOfficeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({
      id: offices.id,
      slug: offices.slug,
      name: offices.name,
      status: offices.status,
      publishedAt: offices.publishedAt,
    })
    .from(offices)
    .where(eq(offices.id, data.id));
  if (!existing) return { ok: false, error: "That office no longer exists." };

  // An office row is its own office, so ownership is the row id.
  requireOwnership(actor, { officeId: existing.id });

  if (data.status !== existing.status && !can(actor, "offices", "publish")) {
    return { ok: false, error: "Only a super admin can change whether an office is published." };
  }

  if (data.status === "published") {
    const alt = await altTextByIds([data.heroImageId, data.seoOgImageId]);
    const problems = officePublishProblems(data, {
      hero: alt.get(data.heroImageId),
      shareImage: alt.get(data.seoOgImageId),
    });
    if (problems.length > 0) {
      return { ok: false, error: `Not ready to publish. Add: ${problems.join(", ")}.` };
    }
  }

  await db
    .update(offices)
    .set({
      slug: data.slug,
      name: data.name,
      country: data.country,
      timezone: data.timezone,
      addressLine1: blank(data.addressLine1),
      addressLine2: blank(data.addressLine2),
      city: blank(data.city),
      state: blank(data.state),
      postcode: blank(data.postcode),
      phone: blank(data.phone),
      phoneDisplay: blank(data.phoneDisplay),
      whatsapp: blank(data.whatsapp),
      email: blank(data.email),
      mapsUrl: blank(data.mapsUrl),
      mapsEmbedUrl: blank(data.mapsEmbedUrl),
      openingHours: data.openingHours,
      profileHtml: blank(sanitize(data.profileHtml)),
      credentialsHtml: blank(sanitize(data.credentialsHtml)),
      heroImageId: blank(data.heroImageId),
      isActive: data.isActive,
      status: data.status,
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : null,
      seoTitle: blank(data.seoTitle),
      seoDescription: blank(data.seoDescription),
      seoOgImageId: blank(data.seoOgImageId),
      seoNoindex: data.seoNoindex,
      canonicalUrl: blank(data.canonicalUrl),
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(offices.id, data.id));

  if (existing.slug !== data.slug && existing.status === "published") {
    const to = `/offices/${data.slug}`;
    await db
      .insert(redirects)
      .values({
        fromPath: `/offices/${existing.slug}`,
        toPath: to,
        note: `${existing.name} was renamed`,
        createdBy: actor.id,
      })
      .onConflictDoUpdate({
        target: redirects.fromPath,
        set: { toPath: to, isActive: true, updatedBy: actor.id, updatedAt: new Date() },
      });
  }

  await writeAudit({
    userId: actor.id,
    action: data.status === existing.status ? "update" : data.status === "published" ? "publish" : "unpublish",
    entityType: "offices",
    entityId: data.id,
    summary: `${data.name} updated`,
  });

  revalidatePath("/admin/offices");
  // The header, footer and contact cards all read office details.
  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}
