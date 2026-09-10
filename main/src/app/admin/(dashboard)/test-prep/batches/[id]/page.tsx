import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { FlatBadge, StatusBadge, ViewSiteLink } from "@/components/shared/admin/list-ui";
import { BatchEditor } from "@/features/test-prep/components/batch-editor";
import { seatLabel } from "@/features/test-prep/seats";
import { courseOptions, getAdminBatch, trainerOptions } from "@/features/test-prep/admin-queries";
import { Button } from "@/components/ui/admin/button";

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
    <div className="space-y-6">
      <EditorHeader
        backHref="/admin/test-prep/batches"
        backLabel="Batches"
        title={row.batchName}
        meta={
          <>
            <StatusBadge status={seatLabel(row).toLowerCase().replace(/ /g, "_")} />
            <FlatBadge variant="outline">{row.courseName}</FlatBadge>
          </>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/test-prep/registrations?batch=${row.id}`}>
                <Users />
                Registrations
              </Link>
            </Button>
            <ViewSiteLink href={`/test-preparation/${row.courseSlug}`} />
          </>
        }
      />

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
    </div>
  );
}
