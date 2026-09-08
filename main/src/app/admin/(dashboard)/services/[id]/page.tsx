import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { ServiceEditor } from "@/components/admin/service-editor";
import { getAdminService, mediaIdByPath, pickedMedia, uiStringsFor } from "@/server/queries/admin-content";
import { servicePath } from "@/lib/validators/service";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "services", "update");

  const row = await getAdminService((await params).id);
  if (!row) notFound();

  const strings = await uiStringsFor(`service.${row.slug}.`);
  // The poster is stored as a path because the page renders it directly, so it is matched back
  // to the media row it came from.
  const posterImageId = await mediaIdByPath(strings.get(`service.${row.slug}.poster`) ?? "");
  const media = await pickedMedia([row.artworkId, row.reelId, row.seoOgImageId, posterImageId]);
  const path = servicePath(row.slug);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.name}</h1>
        <Link className="btn-black-sm" href={`/admin/services/${row.id}/faqs`}>
          Questions
        </Link>
        <a className="btn-black-sm" href={path} target="_blank" rel="noreferrer">
          View on site
        </a>
      </div>

      <ServiceEditor
        canDelete={can(actor, "services", "delete")}
        canPublish={can(actor, "services", "publish")}
        media={media}
        value={{
          id: row.id,
          slug: row.slug,
          name: row.name,
          category: row.category,
          officeScope: row.officeScope,
          summary: row.summary ?? "",
          introHtml: row.introHtml ?? "",
          steps: row.steps ?? [],
          facts: row.facts ?? [],
          documents: row.documents ?? [],
          artworkId: row.artworkId,
          reelId: row.reelId,
          posterImageId,
          tone: row.tone ?? "blue",
          isFeatured: row.isFeatured,
          status: row.status,
          sortOrder: row.sortOrder,
          label: strings.get(`service.${row.slug}.label`) ?? "",
          stepsTitle: strings.get(`service.${row.slug}.stepsTitle`) ?? "",
          listTitle: strings.get(`service.${row.slug}.listTitle`) ?? "",
          seoTitle: row.seoTitle ?? "",
          seoDescription: row.seoDescription ?? "",
          seoOgImageId: row.seoOgImageId,
          seoNoindex: row.seoNoindex,
          canonicalUrl: row.canonicalUrl ?? "",
        }}
      />
    </>
  );
}
