"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import { requireActor } from "@/lib/session";
import { requireOwnership, requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { findInRichText, findUsage } from "@/server/queries/media";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const describe = z.object({
  id: z.uuid(),
  altText: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
});

export async function describeMedia(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "media", "update");

  const parsed = describe.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields below." };
  const data = parsed.data;

  const [existing] = await db
    .select({ officeId: mediaAssets.officeId, filename: mediaAssets.filename })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, data.id));
  if (!existing) return { ok: false, error: "That file no longer exists." };
  requireOwnership(actor, existing);

  await db
    .update(mediaAssets)
    .set({
      altText: data.altText ?? null,
      caption: data.caption ?? null,
      updatedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(mediaAssets.id, data.id));

  await writeAudit({
    userId: actor.id,
    action: "update",
    entityType: "media_assets",
    entityId: data.id,
    summary: `described ${existing.filename ?? "a file"}`,
  });

  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteMedia(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "media", "delete");

  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That file could not be found." };

  const [existing] = await db
    .select({
      officeId: mediaAssets.officeId,
      filename: mediaAssets.filename,
      staticPath: mediaAssets.staticPath,
      kind: mediaAssets.kind,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, parsed.data.id));
  if (!existing) return { ok: false, error: "That file no longer exists." };
  requireOwnership(actor, existing);

  // Naming what is using it is the difference between a useful refusal and a dead end.
  const usage = await findUsage(parsed.data.id);
  if (usage.length > 0) {
    const names = usage.slice(0, 3).map((u) => `${u.kind} "${u.label}"`).join(", ");
    const more = usage.length > 3 ? ` and ${usage.length - 3} more` : "";
    return { ok: false, error: `Still in use by ${names}${more}. Remove it there first.` };
  }

  if (existing.staticPath) {
    const inBody = await findInRichText(existing.staticPath);
    if (inBody > 0) {
      return { ok: false, error: `Still used inside ${inBody} article ${inBody === 1 ? "body" : "bodies"}. Remove it there first.` };
    }
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, parsed.data.id));
  await writeAudit({
    userId: actor.id,
    action: "delete",
    entityType: "media_assets",
    entityId: parsed.data.id,
    summary: `deleted ${existing.filename ?? "a file"}`,
  });

  revalidatePath("/admin/media");
  return { ok: true };
}
