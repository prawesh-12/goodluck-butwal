import { z } from "zod";
import { contentStatuses, mediaId, seoFields, slugField } from "./page";

export const testTypes = ["ielts", "pte"] as const;
export const batchModes = ["in_person", "online", "hybrid"] as const;
export const batchStatuses = ["open", "filling_fast", "full", "closed", "completed"] as const;
export const regStatuses = ["registered", "attended", "cancelled"] as const;

const money = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), "Use a number, like 12000 or 12000.50")
  .default("");

export const syllabusItem = z.object({
  title: z.string().trim().min(1, "Give the section a heading."),
  body: z.string().trim().min(1, "Say what is covered."),
});

const courseFields = {
  slug: slugField,
  testType: z.enum(testTypes),
  name: z.string().trim().min(1, "Give the course a name."),
  summary: z.string().trim().default(""),
  descriptionHtml: z.string().default(""),
  syllabus: z.array(syllabusItem).default([]),
  heroImageId: mediaId,
  defaultFee: money,
  feeCurrency: z.string().trim().length(3, "Three letters, like NPR.").default("NPR"),
  status: z.enum(contentStatuses),
  sortOrder: z.coerce.number().int().min(0).default(0),
  ...seoFields,
};

export const createTestPrepCourseSchema = z.object(courseFields);
export const updateTestPrepCourseSchema = z.object({ id: z.uuid(), ...courseFields });
export type TestPrepCourseInput = z.infer<typeof createTestPrepCourseSchema>;

// Postgres hands a time column back as HH:MM:SS, an <input type="time"> posts HH:MM.
const clock = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use a 24 hour time, like 07:30.")
  .transform((v) => v.slice(0, 5));

const optionalClock = z.preprocess((v) => (v === "" || v === undefined ? null : v), clock.nullable());
const optionalDate = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.iso.date("Check the date.").nullable());
const optionalId = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.uuid().nullable());

const batchFields = {
  courseId: z.uuid("Choose a course."),
  batchName: z.string().trim().min(1, "Name the batch."),
  startDate: z.iso.date("Choose a start date."),
  endDate: optionalDate,
  scheduleDays: z
    .array(z.coerce.number().int().min(0, "A day is 0 to 6.").max(6, "A day is 0 to 6."))
    .default([]),
  startTime: optionalClock,
  endTime: optionalClock,
  mode: z.enum(batchModes),
  trainerId: optionalId,
  totalSeats: z.coerce.number().int().min(1, "A batch needs at least one seat."),
  seatsTaken: z.coerce.number().int().min(0, "Seats taken cannot be negative."),
  fee: money,
  status: z.enum(batchStatuses),
  notes: z.string().trim().default(""),
};

type BatchShape = {
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  totalSeats: number;
  seatsTaken: number;
};

function checkBatch(value: BatchShape, ctx: z.RefinementCtx) {
  if (value.seatsTaken > value.totalSeats) {
    ctx.addIssue({
      code: "custom",
      path: ["seatsTaken"],
      message: "More seats are taken than the batch has. Raise the total seats first.",
    });
  }
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "The class cannot end before it starts." });
  }
  if (value.endDate && value.endDate < value.startDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "The batch cannot end before it starts." });
  }
}

export const createBatchSchema = z.object(batchFields).superRefine(checkBatch);
export const updateBatchSchema = z.object({ id: z.uuid(), ...batchFields }).superRefine(checkBatch);
export type BatchInput = z.infer<typeof createBatchSchema>;

export const updateRegistrationSchema = z.object({
  id: z.uuid(),
  status: z.enum(regStatuses),
  notes: z.string().trim().optional(),
});

export const registerSchema = z.object({
  batchId: z.uuid("Choose a batch."),
  fullName: z.string().trim().min(1, "Tell us your name."),
  email: z.email("Check the email address.").toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^[+(0-9][0-9 ()\-.]{5,24}$/, "That does not look like a phone number.")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().optional(),
  sourcePage: z.string().optional(),
  turnstileToken: z.string().optional(),
  // Real people leave this empty. Bots fill everything in.
  company_website: z.string().optional(),
});

export function testPrepPath(slug: string) {
  return `/test-preparation/${slug}`;
}

export function testPrepPublishProblems(course: {
  name: string;
  summary: string;
  descriptionHtml: string;
  syllabus: unknown[];
}): string[] {
  const problems: string[] = [];
  if (!course.name.trim()) problems.push("Name is empty.");
  if (!course.summary.trim()) problems.push("The one-line summary is empty.");
  if (!course.descriptionHtml.trim()) problems.push("The course description is empty.");
  if (course.syllabus.length === 0) problems.push("There is nothing in the syllabus.");
  return problems;
}
