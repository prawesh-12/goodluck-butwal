import Link from "next/link";
import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { CourseEditor } from "@/components/admin/course-editor";
import {
  destinationOptions,
  institutionOptions,
  listCourseCategories,
} from "@/server/queries/admin-catalogue";

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
        shareImage={null}
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
          seoTitle: "",
          seoDescription: "",
          seoOgImageId: null,
          seoNoindex: false,
          canonicalUrl: "",
        }}
      />
    </>
  );
}
