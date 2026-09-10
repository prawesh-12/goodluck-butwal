"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { requireOwnership, requirePermission } from "@/lib/auth/rbac";
import { destroyAsset, getAsset } from "@/lib/integrations/cloudinary";
import { assetByPublicId, findInRichText, findUsage, folderOf } from "@/features/media/queries";

type Result = { ok: true } | { ok: false; error: string };

const publicId = z.string().trim().min(1).max(300);
const resourceType = z.enum(["image", "video"]);

const describe = z.object({
  publicId,
  filename: z.string().trim().max(200),
  altText: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
});

const record = z.object({
  publicId,
  resourceType,
  altText: z.string().trim().max(300).optional(),
});

// Called once the browser has finished uploading straight to Cloudinary. The size, dimensions and
// format are read back from Cloudinary rather than taken from the browser, which is the party that
// just reported the upload.
export async function recordUpload(input: unknown): Promise<Result> {
  const actor = await requireActor();

  const parsed = record.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That upload could not be recorded." };
  const data = parsed.data;

  const existing = await assetByPublicId(data.publicId, data.resourceType);
  requirePermission(actor, "media", existing ? "update" : "create");
  if (existing) requireOwnership(actor, existing);

  const asset = await getAsset(data.resourceType, data.publicId);
  if (!asset) return { ok: false, error: "Cloudinary has no file at that address." };

  const columns = {
    filename: asset.filename,
    mimeType: `${data.resourceType}/${asset.format}`,
    sizeBytes: asset.bytes,
    width: asset.width,
    height: asset.height,
  };

  if (existing) {
    await db
      .update(mediaAssets)
      .set({ ...columns, updatedBy: actor.id, updatedAt: new Date() })
      .where(eq(mediaAssets.id, existing.id));
  } else {
    // The reference row is what a CMS section points at, so the picker can find what was just
    // uploaded. Nothing about browsing the library depends on it.
    await db.insert(mediaAssets).values({
      ...columns,
      kind: "cloudinary",
      type: data.resourceType,
      cloudinaryPublicId: data.publicId,
      altText: data.altText || null,
      folder: folderOf(data.publicId),
      officeId: actor.officeId,
      uploadedBy: actor.id,
    });
  }

  revalidatePath(data.resourceType === "video" ? "/admin/videos" : "/admin/images");
  return { ok: true };
}

// Alt text lives on the reference row, because that is what the publish checks read. An asset
// that only exists on Cloudinary gets its row here, the first time someone describes it.
export async function describeImage(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "media", "update");

  const parsed = describe.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the fields below." };
  const data = parsed.data;

  const existing = await assetByPublicId(data.publicId, "image");
  if (existing) {
    requireOwnership(actor, existing);
    await db
      .update(mediaAssets)
      .set({
        altText: data.altText ?? null,
        caption: data.caption ?? null,
        updatedBy: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, existing.id));
  } else {
    await db.insert(mediaAssets).values({
      kind: "cloudinary",
      type: "image",
      cloudinaryPublicId: data.publicId,
      filename: data.filename || data.publicId,
      folder: folderOf(data.publicId),
      altText: data.altText ?? null,
      caption: data.caption ?? null,
      officeId: actor.officeId,
      uploadedBy: actor.id,
    });
  }

  revalidatePath("/admin/images");
  return { ok: true };
}

export async function deleteAsset(input: unknown): Promise<Result> {
  const actor = await requireActor();
  requirePermission(actor, "media", "delete");

  const parsed = z.object({ publicId, resourceType }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "That file could not be found." };
  const data = parsed.data;

  const row = await assetByPublicId(data.publicId, data.resourceType);
  if (row) {
    requireOwnership(actor, row);
    if (row.kind === "static") {
      return { ok: false, error: `${row.staticPath} ships with the site. Remove it from the repository instead.` };
    }

    // Naming what is using it is the difference between a useful refusal and a dead end.
    const usage = await findUsage(row.id);
    if (usage.length > 0) {
      const names = usage.slice(0, 3).map((u) => `${u.kind} "${u.label}"`).join(", ");
      const more = usage.length > 3 ? ` and ${usage.length - 3} more` : "";
      return { ok: false, error: `Still in use by ${names}${more}. Remove it there first.` };
    }
  }

  const inBody = await findInRichText(data.publicId);
  if (inBody > 0) {
    return { ok: false, error: `Still used inside ${inBody} article ${inBody === 1 ? "body" : "bodies"}. Remove it there first.` };
  }

  await destroyAsset(data.resourceType, data.publicId);
  if (row) await db.delete(mediaAssets).where(eq(mediaAssets.id, row.id));

  revalidatePath(data.resourceType === "video" ? "/admin/videos" : "/admin/images");
  return { ok: true };
}
