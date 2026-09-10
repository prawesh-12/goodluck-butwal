import Link from "next/link";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { CourseEditor } from "@/features/courses/components/course-editor";
import { destinationOptions, listCourseCategories } from "@/features/courses/admin-queries";
import { institutionOptions } from "@/features/institutions/admin-queries";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const actor = await requireActor();
  allow(actor, "courses", "create");

  const [institutions, categories, destinations] = await Promise.all([
    institutionOptions(),
    listCourseCategories(),
    destinationOptions(),
  ]);

  if (institutions.length === 0) {
    return (
      <>
        <h1 className="t-h4">New course</h1>
        <p className="t-body admin-empty">
          A course has to belong to an institution, and there are none yet.{" "}
          <Link href="/admin/institutions/new">Add an institution</Link> first.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="t-h4">New course</h1>
      <CourseEditor
        canDelete={false}
        canPublish={can(actor, "courses", "publish")}
        institutions={institutions}
        categories={categories}
        destinations={destinations}
        value={{
          slug: "",
          name: "",
          institutionId: "",
          destinationId: null,
          country: "",
          qualificationLevel: "",
          categoryId: "",
          durationMonths: "",
          durationLabel: "",
          intakes: [],
          tuitionFeeMin: "",
          tuitionFeeMax: "",
          tuitionCurrency: "",
          descriptionHtml: "",
          entryRequirementsHtml: "",
          status: "draft",
          sortOrder: 0,
        }}
      />
    </>
  );
}
