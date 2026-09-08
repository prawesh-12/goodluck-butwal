import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { CourseImportForm } from "@/components/admin/course-import-form";
import { IMPORT_COLUMNS, INTAKE_SEPARATOR } from "@/lib/course-import";
import { institutionOptions, listCourseCategories } from "@/server/queries/admin-catalogue";

export const dynamic = "force-dynamic";

export default async function ImportCoursesPage() {
  const actor = await requireActor();
  allow(actor, "courses", "create");

  const [institutions, categories] = await Promise.all([institutionOptions(), listCourseCategories()]);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">Import courses</h1>
        <Link className="btn-black-sm" href="/admin/courses">
          Back to courses
        </Link>
      </div>

      {institutions.length === 0 ? (
        <p className="t-body admin-empty">
          Every course needs an institution, and there are none yet.{" "}
          <Link href="/admin/institutions/new">Add an institution</Link> first.
        </p>
      ) : (
        <>
          <p className="t-small admin-count">
            {institutions.length} institutions and {categories.length} subject areas can be named in
            the file.
          </p>
          <CourseImportForm columns={IMPORT_COLUMNS.join(",")} separator={INTAKE_SEPARATOR} />
        </>
      )}
    </>
  );
}
