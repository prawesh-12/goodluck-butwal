import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { CourseCategoryManager } from "@/components/admin/course-category-manager";
import { coursesPerCategory, listCourseCategories } from "@/server/queries/admin-catalogue";

export const dynamic = "force-dynamic";

export default async function CourseCategoriesPage() {
  const actor = await requireActor();
  allow(actor, "courseCategories", "read");

  const [categories, counts] = await Promise.all([listCourseCategories(), coursesPerCategory()]);
  const rows = categories.map((category) => ({ ...category, courses: counts.get(category.id) ?? 0 }));

  return (
    <>
      <h1 className="t-h4">Subject areas</h1>
      <p className="t-small admin-count">{rows.length} subject areas</p>

      <CourseCategoryManager
        rows={rows}
        canCreate={can(actor, "courseCategories", "create")}
        canEdit={can(actor, "courseCategories", "update")}
        canDelete={can(actor, "courseCategories", "delete")}
      />
    </>
  );
}
