import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
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
    <>
      <h1 className="t-h4">New batch</h1>
      {courses.length === 0 ? (
        <p className="t-body admin-empty">There is no course to attach a batch to yet. Add a course first.</p>
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
    </>
  );
}
