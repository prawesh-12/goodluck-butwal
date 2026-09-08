import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { InstitutionEditor } from "@/components/admin/institution-editor";
import { InstitutionGallery } from "@/components/admin/institution-gallery";
import { institutionPath } from "@/components/admin/course-meta";
import { pickedMedia } from "@/server/queries/admin-content";
import {
  courseCountFor,
  destinationOptions,
  getAdminInstitution,
  institutionGallery,
} from "@/server/queries/admin-catalogue";

export const dynamic = "force-dynamic";

export default async function EditInstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "institutions", "update");

  const row = await getAdminInstitution((await params).id);
  if (!row) notFound();

  const [media, destinations, gallery, courses] = await Promise.all([
    pickedMedia([row.logoId, row.seoOgImageId]),
    destinationOptions(),
    institutionGallery(row.id),
    courseCountFor(row.id),
  ]);
  const path = institutionPath(row.slug);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.name}</h1>
        <a className="btn-black-sm" href={path} target="_blank" rel="noreferrer">
          View on site
        </a>
      </div>
      <p className="t-small admin-count">
        {courses} {courses === 1 ? "course" : "courses"} at this institution.
        {courses > 0 ? " They have to be moved before it can be deleted." : ""}
      </p>

      <InstitutionEditor
        canDelete={can(actor, "institutions", "delete")}
        canPublish={can(actor, "institutions", "publish")}
        media={media}
        destinations={destinations}
        value={{
          id: row.id,
          slug: row.slug,
          name: row.name,
          logoId: row.logoId,
          destinationId: row.destinationId,
          country: row.country ?? "",
          city: row.city ?? "",
          websiteUrl: row.websiteUrl ?? "",
          descriptionHtml: row.descriptionHtml ?? "",
          isPartner: row.isPartner,
          isFeatured: row.isFeatured,
          status: row.status,
          sortOrder: row.sortOrder,
          seoTitle: row.seoTitle ?? "",
          seoDescription: row.seoDescription ?? "",
          seoOgImageId: row.seoOgImageId,
          seoNoindex: row.seoNoindex,
          canonicalUrl: row.canonicalUrl ?? "",
        }}
      />

      <InstitutionGallery
        institutionId={row.id}
        canEdit={can(actor, "institutions", "update")}
        rows={gallery.map((item) => ({
          id: item.id,
          mediaId: item.mediaId,
          caption: item.caption ?? "",
          media: item.media,
        }))}
      />
    </>
  );
}
