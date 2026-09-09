import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { listMedia, PAGE_SIZE, type MediaFilters } from "@/features/media/queries";
import { MediaGrid } from "@/features/media/components/media-grid";
import { ListHeader } from "@/components/shared/admin/list-ui";

export const dynamic = "force-dynamic";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "media", "read");

  const params = await searchParams;
  const filters: MediaFilters = { ...params, page: Number(params.page ?? 1) };
  const { rows, total, missingAlt, page, folders } = await listMedia(filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <ListHeader title="Media" count={total} countNoun="files" />
      <MediaGrid
        rows={rows}
        folders={folders}
        total={total}
        missingAlt={missingAlt}
        page={page}
        pages={pages}
        canDelete={can(actor, "media", "delete")}
        canUpload={can(actor, "media", "create")}
      />
    </div>
  );
}
