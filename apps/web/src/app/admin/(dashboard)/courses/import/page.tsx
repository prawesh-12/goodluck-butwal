import { Building2 } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { EmptyState } from "@/components/shared/admin/states";
import { NewButton } from "@/components/shared/admin/list-ui";
import { CourseImportForm } from "@/features/courses/components/course-import-form";
import { IMPORT_COLUMNS, INTAKE_SEPARATOR } from "@/features/courses/import";
import { institutionOptions } from "@/features/institutions/admin-queries";

export const dynamic = "force-dynamic";

export default async function ImportCoursesPage() {
  const actor = await requireActor();
  allow(actor, "courses", "create");

  const institutions = await institutionOptions();

  return (
    <div className="space-y-6">
      <EditorHeader backHref="/admin/courses" backLabel="Courses" title="Import courses" />

      {institutions.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Add an institution first"
          description="Every course belongs to a university or college, and there are none yet."
          action={<NewButton href="/admin/institutions/new">New institution</NewButton>}
        />
      ) : (
        <CourseImportForm columns={IMPORT_COLUMNS.join(",")} separator={INTAKE_SEPARATOR} />
      )}
    </div>
  );
}
