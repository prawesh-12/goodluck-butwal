import { NextResponse } from "next/server";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError, requirePermission } from "@/lib/auth/rbac";
import { writeAudit } from "@/lib/security/audit";
import { sniffImageType, uploadImage } from "@/lib/integrations/cloudinary";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const FOLDER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  // Outside the try: an unauthenticated caller gets Better Auth's redirect, not a 500.
  const actor = await requireActor();

  try {
    requirePermission(actor, "media", "create");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Choose an image to upload.", 400);
    }
    if (file.size > MAX_BYTES) {
      return fail("That image is over 8 MB. Resize it and try again.", 413);
    }

    const folder = String(form.get("folder") ?? "general");
    if (!FOLDER.test(folder)) {
      return fail("That folder name is not allowed. Use lower case letters, numbers and hyphens.", 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = sniffImageType(bytes);
    if (!mimeType) {
      return fail("Only JPEG, PNG, WebP and AVIF images can be uploaded.", 415);
    }

    const uploaded = await uploadImage(new Blob([bytes], { type: mimeType }), `goodluck/${folder}`);

    const [row] = await db
      .insert(mediaAssets)
      .values({
        kind: "cloudinary",
        type: "image",
        cloudinaryPublicId: uploaded.publicId,
        filename: file.name || `${uploaded.publicId}.${uploaded.format}`,
        mimeType,
        sizeBytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
        altText: String(form.get("altText") ?? "") || null,
        folder,
        officeId: actor.officeId,
        uploadedBy: actor.id,
      })
      .returning();

    await writeAudit({
      userId: actor.id,
      action: "create",
      entityType: "media_assets",
      entityId: row.id,
      summary: `uploaded ${row.filename} to ${folder}`,
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return fail("You cannot upload images.", 403);
    }
    console.error("media upload failed", error);
    return fail("The upload did not go through. Try again.", 500);
  }
}
