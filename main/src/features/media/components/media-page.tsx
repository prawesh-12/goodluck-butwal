import { Suspense } from "react";
import { Upload } from "lucide-react";
import { listLibrary } from "@/features/media/queries";
import { Button } from "@/components/ui/admin/button";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { PageHeader } from "@/components/shared/admin/page-header";
import { CardGridSkeleton } from "@/components/shared/admin/states";
import { AssetGrid } from "@/features/media/components/asset-library";
import { UploadDialog } from "@/features/media/components/upload-dialog";
import type { ResourceType } from "@/features/media/components/asset-utils";

type Rights = { canUpload: boolean; canUpdate: boolean; canDelete: boolean };

const COPY = {
  image: { title: "Images", many: "images", description: "Pictures you can use across the website." },
  video: { title: "Videos", many: "videos", description: "Videos you can use across the website." },
} as const;

async function Assets({
  resourceType,
  q,
  cursor,
  rights,
}: {
  resourceType: ResourceType;
  q: string;
  cursor?: string;
  rights: Rights;
}) {
  const { assets, total, cursor: next } = await listLibrary({ resourceType, q, cursor });

  return (
    <AssetGrid
      resourceType={resourceType}
      assets={assets}
      total={total}
      cursor={next}
      q={q}
      onFirstPage={!cursor}
      {...rights}
    />
  );
}

export function MediaPage({
  resourceType,
  params,
  rights,
}: {
  resourceType: ResourceType;
  params: Record<string, string | undefined>;
  rights: Rights;
}) {
  const copy = COPY[resourceType];
  const q = params.q ?? "";
  // The library pages forward, one Cloudinary cursor at a time. The cursor rides in "page"
  // because that is the only key FilterBar clears when the search changes, and a cursor taken
  // from one search is meaningless under the next.
  const cursor = params.page;

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          rights.canUpload ? (
            <UploadDialog
              resourceType={resourceType}
              trigger={
                <Button>
                  <Upload />
                  Upload {copy.many}
                </Button>
              }
            />
          ) : null
        }
      />

      <FilterBar searchPlaceholder={`Search ${copy.many}...`} />

      <Suspense key={`${q}|${cursor ?? ""}`} fallback={<CardGridSkeleton />}>
        <Assets resourceType={resourceType} q={q} cursor={cursor} rights={rights} />
      </Suspense>
    </div>
  );
}
