import { z } from "zod";
import { INTAKE_MONTHS, coursePath, qualificationLevels } from "@/config/course-meta";
import { slugField } from "@/lib/validators/content-fields";
import { contentStatuses } from "@/lib/validators/fields";

const money = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), "Use a plain number, like 24000 or 24000.50")
  .default("");

const fields = {
  slug: slugField,
  name: z.string().trim().min(1, "Give the course a name."),
  // A course with no institution has nowhere to live on the site, so it can never be saved.
  institutionId: z.uuid("Choose the institution that runs this course."),
  destinationId: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.uuid().nullable()),
  country: z.string().trim().default(""),
  qualificationLevel: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(qualificationLevels).nullable(),
  ),
  categoryId: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.uuid().nullable()),
  durationMonths: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
    z.number().int().min(1, "A course runs for at least one month.").max(120).nullable(),
  ),
  durationLabel: z.string().trim().default(""),
  intakes: z.array(z.enum(INTAKE_MONTHS)).default([]),
  tuitionFeeMin: money,
  tuitionFeeMax: money,
  tuitionCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z]{3}$/.test(v), "Use a three letter code, like AUD or NPR")
    .default(""),
  descriptionHtml: z.string().default(""),
  entryRequirementsHtml: z.string().default(""),
  status: z.enum(contentStatuses),
  sortOrder: z.coerce.number().int().min(0).default(0),
};

function checkFees(data: { tuitionFeeMin: string; tuitionFeeMax: string }, ctx: z.RefinementCtx) {
  if (!data.tuitionFeeMin || !data.tuitionFeeMax) return;
  if (Number(data.tuitionFeeMin) <= Number(data.tuitionFeeMax)) return;
  ctx.addIssue({
    code: "custom",
    path: ["tuitionFeeMax"],
    message: "The top of the fee range cannot be below the bottom.",
  });
}

export const createCourseSchema = z.object(fields).superRefine(checkFees);
export const updateCourseSchema = z.object({ id: z.uuid(), ...fields }).superRefine(checkFees);

export type CourseInput = z.infer<typeof createCourseSchema>;

export type CoursePublishFields = {
  name: string;
  institutionId: string;
  qualificationLevel: string | null;
  categoryId: string | null;
  descriptionHtml: string;
  intakes: string[];
  tuitionFeeMin: string;
  tuitionFeeMax: string;
  tuitionCurrency: string;
};

export function coursePublishProblems(data: CoursePublishFields): string[] {
  const problems: string[] = [];
  if (!data.name.trim()) problems.push("Name is empty.");
  if (!data.institutionId) problems.push("No institution is chosen.");
  if (!data.qualificationLevel) problems.push("No qualification level is chosen.");
  if (!data.categoryId) problems.push("No subject area is chosen.");
  if (!data.descriptionHtml.trim()) problems.push("The description is empty.");
  if (data.intakes.length === 0) problems.push("No intake months are ticked.");
  if ((data.tuitionFeeMin || data.tuitionFeeMax) && !data.tuitionCurrency) {
    problems.push("A fee is set but no currency is chosen.");
  }
  return problems;
}

export { coursePath };

const categoryFields = {
  name: z.string().trim().min(1, "Give the subject area a name."),
  // Left empty, the web address is made from the name.
  slug: z.union([z.literal(""), slugField]).default(""),
  sortOrder: z.coerce.number().int().min(0).default(0),
};

export const createCourseCategorySchema = z.object(categoryFields);
export const updateCourseCategorySchema = z.object({ id: z.uuid(), ...categoryFields });
export const reorderSchema = z.object({ ids: z.array(z.uuid()).min(1) });
