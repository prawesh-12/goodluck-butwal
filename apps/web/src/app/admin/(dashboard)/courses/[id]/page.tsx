import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { CourseEditor } from "@/features/courses/components/course-editor";
import { destinationOptions, getAdminCourse, listCourseCategories } from "@/features/courses/admin-queries";
import { institutionOptions } from "@/features/institutions/admin-queries";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "courses", "update");

  const row = await getAdminCourse((await params).id);
  if (!row) notFound();

  const [institutions, categories, destinations] = await Promise.all([
    institutionOptions(),
    listCourseCategories(),
    destinationOptions(),
  ]);

  return (
    <div className="space-y-6">
      <EditorHeader
        backHref="/admin/courses"
        backLabel="Courses"
        title={row.name}
        meta={<StatusBadge status={row.status} />}
      />

      <CourseEditor
        canDelete={can(actor, "courses", "delete")}
        canPublish={can(actor, "courses", "publish")}
        institutions={institutions}
        categories={categories}
        destinations={destinations}
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
        }}
      />
    </div>
  );
}
