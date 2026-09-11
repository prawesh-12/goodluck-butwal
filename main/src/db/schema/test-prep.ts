import {
  char,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  time,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { base, mediaAssets, offices, publishing } from "./core";
import { batchMode, batchStatus, regStatus, testType } from "./enums";
import { teamMembers } from "./people";

export const testPrepCourses = pgTable("test_prep_courses", {
  ...base,
  ...publishing,
  slug: text("slug").notNull().unique(),
  testType: testType("test_type").notNull(),
  name: text("name").notNull(),
  officeId: uuid("office_id").references(() => offices.id),
  summary: text("summary"),
  descriptionHtml: text("description_html"),
  syllabus: jsonb("syllabus").$type<{ title: string; body: string }[]>(),
  heroImageId: uuid("hero_image_id").references(() => mediaAssets.id),
  defaultFee: numeric("default_fee", { precision: 12, scale: 2 }),
  feeCurrency: char("fee_currency", { length: 3 }).notNull().default("NPR"),
});

export const testPrepBatches = pgTable(
  "test_prep_batches",
  {
    ...base,
    courseId: uuid("course_id")
      .notNull()
      .references(() => testPrepCourses.id, { onDelete: "cascade" }),
    batchName: text("batch_name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    // 0 is Sunday. Times are office-local, read with the office timezone.
    scheduleDays: integer("schedule_days").array(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    mode: batchMode("mode").notNull().default("in_person"),
    trainerId: uuid("trainer_id").references(() => teamMembers.id),
    totalSeats: integer("total_seats").notNull(),
    seatsTaken: integer("seats_taken").notNull().default(0),
    fee: numeric("fee", { precision: 12, scale: 2 }),
    status: batchStatus("status").notNull().default("open"),
    notes: text("notes"),
  },
  (t) => [
    index("test_prep_batches_course_start_idx").on(t.courseId, t.startDate),
    check("test_prep_batches_seats_fit", sql`${t.seatsTaken} <= ${t.totalSeats}`),
  ],
);

export const testPrepRegistrations = pgTable("test_prep_registrations", {
  ...base,
  batchId: uuid("batch_id")
    .notNull()
    .references(() => testPrepBatches.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  notes: text("notes"),
  status: regStatus("status").notNull().default("registered"),
  sourcePage: text("source_page"),
  ipHash: text("ip_hash"),
});
