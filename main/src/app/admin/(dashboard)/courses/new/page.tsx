import { Building2 } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import { NewButton } from "@/components/shared/admin/list-ui";
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

  return (
    <div className="space-y-6">
      <EditorHeader backHref="/admin/courses" backLabel="Courses" title="New course" />

      {institutions.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Add an institution first"
          description="Every course belongs to a university or college, and there are none yet."
          action={<NewButton href="/admin/institutions/new">New institution</NewButton>}
        />
      ) : (
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
      )}
    </div>
  );
}
