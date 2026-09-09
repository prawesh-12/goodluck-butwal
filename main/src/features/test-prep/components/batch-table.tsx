"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/bits";
import { formatDate } from "@/lib/utils/datetime";
import { seatLabel, type BatchStatus } from "@/features/test-prep/seats";
import { classTime, MODE_LABEL, scheduleDays, TEST_LABEL } from "@/features/test-prep/schedule";

export type BatchRow = {
  id: string;
  courseSlug: string;
  courseName: string;
  testType: string;
  batchName: string;
  startDate: string;
  scheduleDays: number[];
  startTime: string | null;
  endTime: string | null;
  mode: string;
  trainer: string | null;
  totalSeats: number;
  seatsTaken: number;
  status: string;
  timezone: string;
};

function Tabs({
  id,
  options,
  value,
  onChange,
  label,
}: {
  id: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap items-center justify-center gap-[10px]">
      {options.map((option) => {
        const on = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(option.value)}
            className="relative h-[38px] overflow-clip rounded-full bg-surface px-5 text-[14px] font-medium leading-[18.2px]"
          >
            {on && (
              <motion.span
                layoutId={id}
                className="absolute inset-0 bg-[#100F12]"
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              />
            )}
            <span className={`relative transition-colors duration-300 ${on ? "text-white" : "text-muted"}`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const TESTS = [
  { value: "all", label: "All tests" },
  { value: "ielts", label: "IELTS" },
  { value: "pte", label: "PTE" },
];

const MODES = [
  { value: "all", label: "All modes" },
  { value: "in_person", label: "In person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export function BatchTable({ batches, empty, filters = false }: { batches: BatchRow[]; empty: string; filters?: boolean }) {
  const [test, setTest] = useState("all");
  const [mode, setMode] = useState("all");

  const shown = batches.filter(
    (batch) => (test === "all" || batch.testType === test) && (mode === "all" || batch.mode === mode),
  );

  return (
    <div className="flex w-full flex-col items-center gap-[30px] md:gap-10">
      {filters ? (
        <div className="flex flex-col items-center gap-[10px]">
          <Tabs id="batch-test" label="Filter by test" options={TESTS} value={test} onChange={setTest} />
          <Tabs id="batch-mode" label="Filter by mode" options={MODES} value={mode} onChange={setMode} />
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="t-body text-muted">{empty}</p>
      ) : (
        <div className="article article-scroll w-full">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Batch</th>
                <th>Starts</th>
                <th>Days</th>
                <th>Time</th>
                <th>Mode</th>
                <th>Trainer</th>
                <th>Seats</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((batch) => (
                <tr key={batch.id}>
                  <td>{TEST_LABEL[batch.testType] ?? batch.courseName}</td>
                  <td>{batch.batchName}</td>
                  <td>{formatDate(batch.startDate)}</td>
                  <td>{scheduleDays(batch.scheduleDays)}</td>
                  <td>{classTime(batch.startTime, batch.endTime, batch.timezone)}</td>
                  <td>{MODE_LABEL[batch.mode]}</td>
                  <td>{batch.trainer ?? "To be confirmed"}</td>
                  <td>
                    <Badge>{seatLabel({ ...batch, status: batch.status as BatchStatus })}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
