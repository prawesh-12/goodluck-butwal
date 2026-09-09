"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, SaveBar, Select, TextArea } from "@/components/shared/admin/repeater";
import { createBatch, deleteBatch, updateBatch } from "@/features/test-prep/actions";
import { DAY_NAMES } from "@/config/content-meta";
import { seatLabel, type BatchStatus } from "@/features/test-prep/seats";

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
  const [row, setRow] = useState<BatchValue>(value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const set = (patch: Partial<BatchValue>) => setRow((current) => ({ ...current, ...patch }));

  const toggleDay = (day: number) =>
    set({
      scheduleDays: row.scheduleDays.includes(day)
        ? row.scheduleDays.filter((d) => d !== day)
        : [...row.scheduleDays, day].sort((a, b) => a - b),
    });

  const label = seatLabel({
    totalSeats: row.totalSeats,
    seatsTaken: row.seatsTaken,
    status: row.status as BatchStatus,
  });

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = row.id ? await updateBatch(row) : await createBatch(row);
        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok && !row.id) router.push(`/admin/test-prep/batches/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <Select
        label="Course"
        help="Which course this batch teaches. The batch is listed under it."
        value={row.courseId}
        onChange={(courseId) => set({ courseId })}
        options={[
          { value: "", label: "Choose a course", disabled: true },
          ...courses.map((c) => ({ value: c.id, label: c.name })),
        ]}
        error={errors.courseId?.[0]}
      />

      <Field
        label="Batch name"
        help="What staff and students call this run, like Morning batch."
        value={row.batchName}
        onChange={(batchName) => set({ batchName })}
        error={errors.batchName?.[0]}
      />

      <Field
        label="Starts"
        type="date"
        help="The first class. Batches that have started are off the public batch table."
        value={row.startDate}
        onChange={(startDate) => set({ startDate })}
        error={errors.startDate?.[0]}
      />

      <Field
        label="Ends"
        type="date"
        help="The last class. Leave empty if it is not set yet."
        value={row.endDate}
        onChange={(endDate) => set({ endDate })}
        error={errors.endDate?.[0]}
      />

      <fieldset className="admin-field">
        <span className="t-small">Class days</span>
        <span className="t-small admin-help">The days of the week this batch runs.</span>
        <div className="admin-actions">
          {DAY_NAMES.map((name, day) => (
            <label key={name} className="t-small">
              <input type="checkbox" checked={row.scheduleDays.includes(day)} onChange={() => toggleDay(day)} />{" "}
              {name.slice(0, 3)}
            </label>
          ))}
        </div>
        {errors.scheduleDays?.[0] ? <span className="admin-clash">{errors.scheduleDays[0]}</span> : null}
      </fieldset>

      <Field
        label="Starts at"
        type="time"
        help="Local time at the office that runs the batch."
        value={row.startTime}
        onChange={(startTime) => set({ startTime })}
        error={errors.startTime?.[0]}
      />

      <Field
        label="Ends at"
        type="time"
        help="Local time at the office that runs the batch."
        value={row.endTime}
        onChange={(endTime) => set({ endTime })}
        error={errors.endTime?.[0]}
      />

      <Select
        label="Mode"
        help="How the class is taught. Visitors filter the batch table by it."
        value={row.mode}
        onChange={(mode) => set({ mode })}
        options={[
          { value: "in_person", label: "In person" },
          { value: "online", label: "Online" },
          { value: "hybrid", label: "Hybrid" },
        ]}
      />

      <Select
        label="Trainer"
        help="Only Nepal team members teach test preparation."
        value={row.trainerId ?? ""}
        onChange={(trainerId) => set({ trainerId: trainerId || null })}
        options={[
          { value: "", label: "Not decided" },
          ...trainers.map((t) => ({ value: t.id, label: t.name })),
        ]}
      />

      <Field
        label="Total seats"
        type="number"
        help="How many people fit in the class."
        value={String(row.totalSeats)}
        onChange={(totalSeats) => set({ totalSeats: Number(totalSeats) || 0 })}
        error={errors.totalSeats?.[0]}
      />

      <Field
        label="Seats taken"
        type="number"
        help="Registrations from the site count themselves. Change this only to correct it."
        value={String(row.seatsTaken)}
        onChange={(seatsTaken) => set({ seatsTaken: Number(seatsTaken) || 0 })}
        error={errors.seatsTaken?.[0]}
      />

      <Select
        label="Status"
        help="Open lets the seat count speak. Anything else overrides it on the site."
        value={row.status}
        onChange={(status) => set({ status })}
        options={[
          { value: "open", label: "Open" },
          { value: "filling_fast", label: "Filling fast" },
          { value: "full", label: "Full" },
          { value: "closed", label: "Closed" },
          { value: "completed", label: "Completed" },
        ]}
      />

      <p className="t-small admin-help">
        The site will show this batch as {label}, with {Math.max(0, row.totalSeats - row.seatsTaken)} seats left.
      </p>

      <Field
        label="Fee"
        help="Charged instead of the course fee. Leave empty to use the course fee."
        value={row.fee}
        onChange={(fee) => set({ fee })}
        error={errors.fee?.[0]}
      />

      <TextArea
        label="Internal notes"
        help="For staff only. Never shown on the site."
        rows={3}
        value={row.notes}
        onChange={(notes) => set({ notes })}
      />

      <SaveBar
        busy={busy}
        message={message}
        viewHref="/test-preparation/batches"
        onDelete={
          canDelete && row.id
            ? async () => {
                if (!confirm(`Delete ${row.batchName}? This cannot be undone.`)) return;
                setBusy(true);
                const result = await deleteBatch({ id: row.id });
                setBusy(false);
                if (result.ok) router.push("/admin/test-prep/batches");
                else setMessage(result.error);
              }
            : undefined
        }
      />
    </form>
  );
}
