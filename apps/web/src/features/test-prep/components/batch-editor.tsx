"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DAY_NAMES } from "@/config/content-meta";
import { seatLabel, seatsRemaining, type BatchStatus } from "@/features/test-prep/seats";
import { CheckboxGroup, SelectField, TextAreaField, TextField } from "@/components/shared/admin/fields";
import { EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import { Button } from "@/components/ui/admin/button";
import { createBatch, deleteBatch, updateBatch } from "@/features/test-prep/actions";

export type BatchValue = {
  id?: string;
  courseId: string;
  batchName: string;
  startDate: string;
  endDate: string;
  scheduleDays: number[];
  startTime: string;
  endTime: string;
  mode: string;
  trainerId: string | null;
  totalSeats: number;
  seatsTaken: number;
  fee: string;
  status: string;
  notes: string;
};

export type Option = { id: string; name: string };

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "filling_fast", label: "Filling fast" },
  { value: "full", label: "Full" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
];

const DAY_OPTIONS = DAY_NAMES.map((name, day) => ({ value: String(day), label: name.slice(0, 3) }));

export function BatchEditor({
  value,
  courses,
  trainers,
  canDelete,
}: {
  value: BatchValue;
  courses: Option[];
  trainers: Option[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [row, setRow] = useState<BatchValue>(value);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    focusFirstError(errors);
  }, [errors]);

  const set = (patch: Partial<BatchValue>) => {
    setRow((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const id = row.id;
  const label = seatLabel({
    totalSeats: row.totalSeats,
    seatsTaken: row.seatsTaken,
    status: row.status as BatchStatus,
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const saved = await run(() => (id ? updateBatch(row) : createBatch(row)), {
      success: id ? "Batch saved" : "Batch created",
      failure: id ? "Couldn't save the batch." : "Couldn't create the batch.",
    });
    if (!saved) return;
    setDirty(false);
    if (id) router.refresh();
    else router.push(`/admin/test-prep/batches/${saved.id}`);
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <UnsavedGuard dirty={dirty} />

      <EditorLayout
        aside={
          <>
            <SectionCard title="Availability">
              <SelectField
                name="status"
                label="Registration status"
                value={row.status}
                onChange={(status) => set({ status })}
                options={STATUSES}
                help="Open lets the seat count speak for itself."
              />
              <p className="text-xs text-muted-foreground">
                Shown as {label.toLowerCase()}, with {Math.max(0, seatsRemaining(row.totalSeats, row.seatsTaken))}{" "}
                seats left.
              </p>
            </SectionCard>

            <SectionCard title="Internal notes" description="For staff only. Never shown on the site.">
              <TextAreaField
                name="notes"
                label="Notes"
                rows={4}
                value={row.notes}
                onChange={(notes) => set({ notes })}
              />
            </SectionCard>
          </>
        }
      >
        <SectionCard title="Batch details">
          <SelectField
            name="courseId"
            label="Course"
            required
            value={row.courseId}
            error={errors.courseId?.[0]}
            onChange={(courseId) => set({ courseId })}
            options={courses.map((course) => ({ value: course.id, label: course.name }))}
            placeholder="Choose a course"
          />

          <TextField
            name="batchName"
            label="Batch name"
            required
            help="What staff and students call this run, like Morning batch."
            value={row.batchName}
            error={errors.batchName?.[0]}
            onChange={(batchName) => set({ batchName })}
          />

          <SelectField
            name="trainerId"
            label="Trainer"
            value={row.trainerId ?? ""}
            emptyLabel="Not decided"
            onChange={(trainerId) => set({ trainerId: trainerId || null })}
            options={trainers.map((trainer) => ({ value: trainer.id, label: trainer.name }))}
          />

          <SelectField
            name="mode"
            label="Taught"
            value={row.mode}
            onChange={(mode) => set({ mode })}
            options={[
              { value: "in_person", label: "In person" },
              { value: "online", label: "Online" },
              { value: "hybrid", label: "Hybrid" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Schedule">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="startDate"
              label="First class"
              required
              type="date"
              value={row.startDate}
              error={errors.startDate?.[0]}
              onChange={(startDate) => set({ startDate })}
            />
            <TextField
              name="endDate"
              label="Last class"
              type="date"
              help="Leave it empty if it is not decided."
              value={row.endDate}
              error={errors.endDate?.[0]}
              onChange={(endDate) => set({ endDate })}
            />
          </div>

          <CheckboxGroup
            name="scheduleDays"
            label="Class days"
            options={DAY_OPTIONS}
            error={errors.scheduleDays?.[0]}
            columns={4}
            selected={row.scheduleDays.map(String)}
            onChange={(days) => set({ scheduleDays: days.map(Number).sort((a, b) => a - b) })}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="startTime"
              label="Starts at"
              type="time"
              value={row.startTime}
              error={errors.startTime?.[0]}
              onChange={(startTime) => set({ startTime })}
            />
            <TextField
              name="endTime"
              label="Ends at"
              type="time"
              value={row.endTime}
              error={errors.endTime?.[0]}
              onChange={(endTime) => set({ endTime })}
            />
          </div>
        </SectionCard>

        <SectionCard title="Seats">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="totalSeats"
              label="Total seats"
              required
              type="number"
              value={String(row.totalSeats)}
              error={errors.totalSeats?.[0]}
              onChange={(totalSeats) => set({ totalSeats: Number(totalSeats) || 0 })}
            />
            <TextField
              name="seatsTaken"
              label="Seats taken"
              type="number"
              help="Registrations count themselves. Change this only to correct it."
              value={String(row.seatsTaken)}
              error={errors.seatsTaken?.[0]}
              onChange={(seatsTaken) => set({ seatsTaken: Number(seatsTaken) || 0 })}
            />
          </div>
        </SectionCard>

        <SectionCard title="Fee" description="Leave it empty to charge the course fee.">
          <TextField
            name="fee"
            label="Fee"
            value={row.fee}
            error={errors.fee?.[0]}
            onChange={(fee) => set({ fee })}
          />
        </SectionCard>
      </EditorLayout>

      <EditorActionBar
        dirty={dirty}
        busy={busy}
        destructive={
          canDelete && id ? (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 />
                  Delete
                </Button>
              }
              title={`Delete ${row.batchName || "this batch"}?`}
              description="This cannot be undone. A batch with registrations has to be closed instead."
              confirmLabel="Delete batch"
              onConfirm={async () => {
                const deleted = await run(() => deleteBatch({ id }), {
                  success: "Batch deleted",
                  failure: "Couldn't delete the batch.",
                });
                if (deleted) {
                  setDirty(false);
                  router.push("/admin/test-prep/batches");
                }
              }}
            />
          ) : null
        }
      />
    </form>
  );
}
