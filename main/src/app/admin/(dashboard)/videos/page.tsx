import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { listLibrary } from "@/features/media/queries";
import { AssetLibrary } from "@/features/media/components/asset-library";
import { ListHeader } from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "media", "read");

  const params = await searchParams;
  const { assets, total, cursor } = await listLibrary({
    resourceType: "video",
    q: params.q,
    cursor: params.cursor,
  });

  return (
    <div className="space-y-4">
      <ListHeader title="Videos" count={total} countNoun="videos on Cloudinary" />
      <AssetLibrary
        resourceType="video"
        assets={assets}
        cursor={cursor}
        canUpload={can(actor, "media", "create")}
        canUpdate={can(actor, "media", "update")}
        canDelete={can(actor, "media", "delete")}
      />
    </div>
  );
}
