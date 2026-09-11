import { GraduationCap } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { NewButton } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { BatchEditor } from "@/features/test-prep/components/batch-editor";
import { courseOptions, trainerOptions } from "@/features/test-prep/admin-queries";

export const dynamic = "force-dynamic";

export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await requireActor();
  allow(actor, "batches", "create");

  const [courses, trainers, params] = await Promise.all([courseOptions(), trainerOptions("np"), searchParams]);

  return (
    <div className="space-y-6">
      <EditorHeader backHref="/admin/test-prep/batches" backLabel="Batches" title="New batch" />

      {courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="There is no course to attach a batch to"
          description="A batch is one run of a course, so the course has to exist first."
          action={
            can(actor, "testPrep", "create") ? (
              <NewButton href="/admin/test-prep/new">New course</NewButton>
            ) : null
          }
        />
      ) : (
        <BatchEditor
          canDelete={can(actor, "batches", "delete")}
          courses={courses}
          trainers={trainers}
          value={{
            courseId: params.course ?? courses[0].id,
            batchName: "",
            startDate: "",
            endDate: "",
            scheduleDays: [],
            startTime: "",
            endTime: "",
            mode: "in_person",
            trainerId: null,
            totalSeats: 20,
            seatsTaken: 0,
            fee: "",
            status: "open",
            notes: "",
          }}
        />
      )}
    </div>
  );
}
