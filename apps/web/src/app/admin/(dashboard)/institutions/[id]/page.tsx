import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { InstitutionEditor } from "@/features/institutions/components/institution-editor";
import { InstitutionGallery } from "@/features/institutions/components/institution-gallery";
import { pickedMedia } from "@/features/media/admin-queries";
import { courseCountFor, getAdminInstitution, institutionGallery } from "@/features/institutions/admin-queries";
import { destinationOptions } from "@/features/courses/admin-queries";

export const dynamic = "force-dynamic";

export default async function EditInstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "institutions", "update");

  const row = await getAdminInstitution((await params).id);
  if (!row) notFound();

  const [media, destinations, gallery, courses] = await Promise.all([
    pickedMedia([row.logoId]),
    destinationOptions(),
    institutionGallery(row.id),
    courseCountFor(row.id),
  ]);

  return (
    <div className="space-y-6">
      <EditorHeader
        backHref="/admin/institutions"
        backLabel="Institutions"
        title={row.name}
        meta={<StatusBadge status={row.status} />}
      />

      <InstitutionEditor
        canDelete={can(actor, "institutions", "delete")}
        canPublish={can(actor, "institutions", "publish")}
        media={media}
        destinations={destinations}
        courses={courses}
        gallery={
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
        }
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
        }}
      />
    </div>
  );
}
