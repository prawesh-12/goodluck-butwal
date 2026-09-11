import { Suspense } from "react";
import { Upload } from "lucide-react";
import { listLibrary, usageFor } from "@/features/media/queries";
import { Button } from "@/components/ui/admin/button";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { PageHeader } from "@/components/shared/admin/page-header";
import { CardGridSkeleton, ErrorState } from "@/components/shared/admin/states";
import { AssetGrid } from "@/features/media/components/asset-library";
import { UploadDialog } from "@/features/media/components/upload-dialog";
import type { ResourceType, Usage } from "@/features/media/components/asset-utils";

type Rights = { canUpload: boolean; canUpdate: boolean; canDelete: boolean };

const COPY = {
  image: { title: "Images", many: "images", description: "Pictures you can use across the website." },
  video: { title: "Videos", many: "videos", description: "Videos you can use across the website." },
} as const;

// Cloudinary is a network call away, so a library outage lands here rather than on the whole page.
async function load(resourceType: ResourceType, q: string, cursor?: string) {
  try {
    const { assets, total, cursor: next } = await listLibrary({ resourceType, q, cursor });

    // One lookup for the whole page. Asking per card cost a query per reference per card, which
    // put the library several seconds behind the grid it was drawing.
    const used = await usageFor(assets.flatMap((asset) => (asset.reference ? [asset.reference.id] : [])));
    const usage: Record<string, Usage[]> = Object.fromEntries(
      assets.flatMap((asset) => {
        const found = asset.reference ? used.get(asset.reference.id) : undefined;
        return found?.length ? [[asset.publicId, found] as const] : [];
      }),
    );

    return { assets, total, cursor: next, usage };
  } catch {
    return null;
  }
}

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
  const page = await load(resourceType, q, cursor);
  if (!page) {
    return (
      <ErrorState title={`Couldn't load the ${COPY[resourceType].many}.`} description="Try again in a moment." />
    );
  }

  return (
    <AssetGrid
      resourceType={resourceType}
      assets={page.assets}
      usage={page.usage}
      total={page.total}
      cursor={page.cursor}
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
