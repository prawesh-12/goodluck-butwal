import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError, requireOwnership, requirePermission } from "@/lib/auth/rbac";
import { uploadTicket, type ResourceType } from "@/lib/integrations/cloudinary";
import { assetByPublicId } from "@/features/media/queries";

export const dynamic = "force-dynamic";

const FOLDER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

// Hands back the signed parameters for one upload. The file itself goes from the browser to
// Cloudinary, so a large video never passes through this route and the platform's request body
// limit never applies to it.
export async function POST(request: Request) {
  // Outside the try: an unauthenticated caller gets Better Auth's redirect, not a 500.
  const actor = await requireActor();

  try {
    const body = (await request.json()) as { resourceType?: string; folder?: string; publicId?: string };
    const resourceType: ResourceType = body.resourceType === "video" ? "video" : "image";
    const replacing = body.publicId?.trim() ?? "";

    requirePermission(actor, "media", replacing ? "update" : "create");

    if (replacing) {
      const existing = await assetByPublicId(replacing, resourceType);
      if (existing) {
        requireOwnership(actor, existing);
        if (existing.kind === "static") {
          return fail(`${existing.staticPath} ships with the site. Replace it in the repository instead.`, 409);
        }
      }
      return NextResponse.json({ ok: true, data: await uploadTicket({ resourceType, publicId: replacing }) });
    }

    const folder = body.folder?.trim() || "general";
    if (!FOLDER.test(folder)) {
      return fail("That folder name is not allowed. Use lower case letters, numbers and hyphens.", 400);
    }

    return NextResponse.json({
      ok: true,
      data: await uploadTicket({ resourceType, folder: `goodluck/${folder}` }),
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return fail("You cannot upload media.", 403);
    }
    console.error("media signing failed", error);
    return fail("The upload could not be started. Try again.", 500);
  }
}
