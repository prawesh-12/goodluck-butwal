import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { listMedia, PAGE_SIZE, type MediaFilters } from "@/server/queries/media";
import { MediaGrid } from "@/components/admin/media-grid";

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
    <>
      <h1 className="t-h4">Media</h1>
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
    </>
  );
}
