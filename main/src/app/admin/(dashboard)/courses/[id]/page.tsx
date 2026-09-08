import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { CourseEditor } from "@/components/admin/course-editor";
import { coursePath } from "@/components/admin/course-meta";
import { pickedMedia } from "@/server/queries/admin-content";
import {
  destinationOptions,
  getAdminCourse,
  institutionOptions,
  listCourseCategories,
} from "@/server/queries/admin-catalogue";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "courses", "update");

  const row = await getAdminCourse((await params).id);
  if (!row) notFound();

  const [institutions, categories, destinations, media] = await Promise.all([
    institutionOptions(),
    listCourseCategories(),
    destinationOptions(),
    pickedMedia([row.seoOgImageId]),
  ]);
  const path = coursePath(row.slug);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.name}</h1>
        <a className="admin-btn" href={path} target="_blank" rel="noreferrer">
          View on site
        </a>
      </div>

      <CourseEditor
        canDelete={can(actor, "courses", "delete")}
        canPublish={can(actor, "courses", "publish")}
        institutions={institutions}
        categories={categories}
        destinations={destinations}
        shareImage={row.seoOgImageId ? (media[row.seoOgImageId] ?? null) : null}
        value={{
          id: row.id,
          slug: row.slug,
          name: row.name,
          institutionId: row.institutionId,
          destinationId: row.destinationId,
          country: row.country ?? "",
          qualificationLevel: row.qualificationLevel ?? "",
          categoryId: row.categoryId ?? "",
          durationMonths: row.durationMonths === null ? "" : String(row.durationMonths),
          durationLabel: row.durationLabel ?? "",
          intakes: row.intakes ?? [],
          tuitionFeeMin: row.tuitionFeeMin ?? "",
          tuitionFeeMax: row.tuitionFeeMax ?? "",
          tuitionCurrency: row.tuitionCurrency ?? "",
          descriptionHtml: row.descriptionHtml ?? "",
          entryRequirementsHtml: row.entryRequirementsHtml ?? "",
          status: row.status,
          sortOrder: row.sortOrder,
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
