import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { MediaPage } from "@/features/media/components/media-page";

export const dynamic = "force-dynamic";

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "media", "read");

  return (
    <MediaPage
      resourceType="image"
      params={await searchParams}
      rights={{
        canUpload: can(actor, "media", "create"),
        canUpdate: can(actor, "media", "update"),
        canDelete: can(actor, "media", "delete"),
      }}
    />
  );
}
