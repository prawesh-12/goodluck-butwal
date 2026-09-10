import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { TestPrepCourseEditor } from "@/features/test-prep/components/course-editor";

export const dynamic = "force-dynamic";

export default async function NewTestPrepCoursePage() {
  const actor = await requireActor();
  allow(actor, "testPrep", "create");

  return (
    <div className="space-y-6">
      <EditorHeader backHref="/admin/test-prep" backLabel="Test preparation" title="New course" />

      <TestPrepCourseEditor
        canDelete={false}
        canPublish={can(actor, "testPrep", "publish")}
        media={{}}
        value={{
          slug: "",
          testType: "ielts",
          name: "",
          summary: "",
          descriptionHtml: "",
          syllabus: [],
          heroImageId: null,
          defaultFee: "",
          feeCurrency: "NPR",
          status: "draft",
          sortOrder: 0,
        }}
      />
    </div>
  );
}
