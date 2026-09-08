"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@db/client";
import { partners } from "@db/schema";
import { requireActor } from "@/lib/session";
import { can, requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import {
  createPartnerSchema,
  partnerPublishProblems,
  reorderPartnersSchema,
  updatePartnerSchema,
  type PartnerInput,
} from "@/lib/validators/partner";
import { altTextByIds } from "@/server/queries/admin-people";

type Result<T = { id: string }> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const blank = (value: string) => (value === "" ? null : value);

async function publishRefusal(data: PartnerInput) {
  if (data.status !== "published") return null;
  const alt = await altTextByIds([data.logoId]);
  const problems = partnerPublishProblems(data, alt.get(data.logoId));
  return problems.length > 0 ? `Not ready to publish. Add: ${problems.join(", ")}.` : null;
}

function columns(data: PartnerInput) {
  return {
    name: data.name,
    logoId: blank(data.logoId),
    websiteUrl: blank(data.websiteUrl),
    isFeatured: data.isFeatured,
    status: data.status,
  };
}

export async function createPartner(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "partners", "create");

  const parsed = createPartnerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (data.status === "published" && !can(actor, "partners", "publish")) {
    return { ok: false, error: "Your role can save this partner but not publish it." };
  }
  const refusal = await publishRefusal(data);
  if (refusal) return { ok: false, error: refusal };

  const [created] = await db
    .insert(partners)
    .values({
      ...columns(data),
      publishedAt: data.status === "published" ? new Date() : null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: partners.id });

  await writeAudit({
    userId: actor.id,
    action: "create",
    entityType: "partners",
    entityId: created.id,
    summary: `added ${data.name}`,
  });

  revalidatePath("/admin/partners");
  revalidatePath("/");
  return { ok: true, data: { id: created.id } };
}

export async function updatePartner(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "partners", "update");

  const parsed = updatePartnerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({ id: partners.id, name: partners.name, status: partners.status, publishedAt: partners.publishedAt })
    .from(partners)
    .where(eq(partners.id, data.id));
  if (!existing) return { ok: false, error: "That partner no longer exists." };

  if (data.status !== existing.status && !can(actor, "partners", "publish")) {
    return { ok: false, error: "Your role can save this partner but not change whether it is published." };
  }
  const refusal = await publishRefusal(data);
  if (refusal) return { ok: false, error: refusal };

  await db
    .update(partners)
    .set({
      ...columns(data),
      publishedAt: data.status === "published" ? (existing.publishedAt ?? new Date()) : null,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(partners.id, data.id));

  await writeAudit({
    userId: actor.id,
    action:
      data.status === existing.status ? "update" : data.status === "published" ? "publish" : "unpublish",
    entityType: "partners",
    entityId: data.id,
    summary: `${data.name} updated`,
  });

  revalidatePath("/admin/partners");
  revalidatePath("/");
  return { ok: true, data: { id: data.id } };
}

export async function deletePartner(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "partners", "delete");

  const parsed = updatePartnerSchema.pick({ id: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That partner could not be found." };

  const [existing] = await db
    .select({ id: partners.id, name: partners.name })
    .from(partners)
    .where(eq(partners.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That partner no longer exists." };

  await db.delete(partners).where(eq(partners.id, existing.id));

  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "partners",
    entityId: existing.id,
    summary: `removed ${existing.name}`,
  });

  revalidatePath("/admin/partners");
  revalidatePath("/");
  return { ok: true, data: { id: existing.id } };
}

export async function reorderPartners(input: unknown): Promise<Result<{ moved: number }>> {
  const actor = await requireActor();
  requirePermission(actor, "partners", "update");

  const parsed = reorderPartnersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That order could not be read." };
  const { ids } = parsed.data;

  const rows = await db.select({ id: partners.id }).from(partners).where(inArray(partners.id, ids));
  if (rows.length !== ids.length) return { ok: false, error: "The list changed. Reload and try again." };

  for (const [index, id] of ids.entries()) {
    await db
      .update(partners)
      .set({ sortOrder: index, updatedBy: actor.id, updatedAt: new Date() })
      .where(eq(partners.id, id));
  }

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "partners",
    summary: `reordered ${ids.length} partners`,
  });

  revalidatePath("/admin/partners");
  revalidatePath("/");
  return { ok: true, data: { moved: ids.length } };
}
