import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow, allowOwn } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { BatchEditor } from "@/components/admin/batch-editor";
import { courseOptions, getAdminBatch, trainerOptions } from "@/server/queries/admin-test-prep";

export const dynamic = "force-dynamic";

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "batches", "update");

  const row = await getAdminBatch((await params).id);
  if (!row) notFound();
  // A batch has no office of its own. Its course decides who may edit it.
  allowOwn(actor, row);

  const [courses, trainers] = await Promise.all([courseOptions(), trainerOptions("np")]);

  return (
    <>
      <div className="admin-actions">
        <h1 className="t-h4">{row.batchName}</h1>
        <Link className="btn-black-sm" href={`/admin/test-prep/registrations?batch=${row.id}`}>
          Registrations
        </Link>
        <a className="btn-black-sm" href="/test-preparation/batches" target="_blank" rel="noreferrer">
          View on site
        </a>
      </div>

      <BatchEditor
        canDelete={can(actor, "batches", "delete")}
        courses={courses}
        trainers={trainers}
        value={{
          id: row.id,
          courseId: row.courseId,
          batchName: row.batchName,
          startDate: row.startDate,
          endDate: row.endDate ?? "",
          scheduleDays: row.scheduleDays ?? [],
          startTime: row.startTime?.slice(0, 5) ?? "",
          endTime: row.endTime?.slice(0, 5) ?? "",
          mode: row.mode,
          trainerId: row.trainerId,
          totalSeats: row.totalSeats,
          seatsTaken: row.seatsTaken,
          fee: row.fee ?? "",
          status: row.status,
          notes: row.notes ?? "",
        }}
      />
    </>
  );
}
