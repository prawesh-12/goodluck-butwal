import { tones } from "@/config/content-meta";
import { z } from "zod";
import { mediaId, seoFields, slugField } from "@/lib/validators/content-fields";
import { contentStatuses } from "@/lib/validators/fields";

// The four bento colours the homepage already paints these cards in. Nothing else renders.
const serviceCategories = ["education", "study_abroad", "test_prep", "migration"] as const;
const officeScopes = ["both", "au", "np"] as const;

const stepItem = z.object({
  title: z.string().trim().min(1, "Give the step a heading."),
  body: z.string().trim().min(1, "Say what happens in the step."),
});

const factItem = z.object({
  label: z.string().trim().min(1, "Say what the number is."),
  value: z.string().trim().min(1, "Add the number."),
});

const documentItem = z.object({ label: z.string().trim().min(1, "Name the document.") });

const serviceFields = {
  slug: slugField,
  name: z.string().trim().min(1, "Give the service a name."),
  category: z.enum(serviceCategories),
  officeScope: z.enum(officeScopes),
  summary: z.string().trim().default(""),
  introHtml: z.string().default(""),
  steps: z.array(stepItem).default([]),
  facts: z.array(factItem).default([]),
  documents: z.array(documentItem).default([]),
  artworkId: mediaId,
  reelId: mediaId,
  tone: z.enum(tones),
  isFeatured: z.boolean().default(false),
  status: z.enum(contentStatuses),
  sortOrder: z.coerce.number().int().min(0).default(0),
  // No column of their own, they are saved as interface text keyed on the slug.
  label: z.string().trim().default(""),
  stepsTitle: z.string().trim().default(""),
  listTitle: z.string().trim().default(""),
  posterImageId: mediaId,
  ...seoFields,
};

export const createServiceSchema = z.object(serviceFields);
export const updateServiceSchema = z.object({ id: z.uuid(), ...serviceFields });

export type ServiceInput = z.infer<typeof createServiceSchema>;

const faqItemSchema = z.object({
  id: z.uuid().optional(),
  question: z.string().trim().min(1, "Ask the question."),
  answerHtml: z.string().trim().min(1, "Answer it."),
});

export const faqListSchema = z.object({
  ownerId: z.uuid(),
  items: z.array(faqItemSchema).default([]),
});

export function servicePath(slug: string) {
  return `/services/${slug}`;
}

export function servicePublishProblems(s: {
  name: string;
  summary: string;
  introHtml: string;
  artworkId: string | null;
  steps: unknown[];
  documents: unknown[];
  label: string;
  stepsTitle: string;
  listTitle: string;
}): string[] {
  const problems: string[] = [];
  if (!s.name.trim()) problems.push("Name is empty.");
  if (!s.summary.trim()) problems.push("The one-line summary is empty.");
  if (!s.introHtml.trim()) problems.push("The introduction is empty.");
  if (!s.artworkId) problems.push("There is no artwork for the homepage card.");
  if (!s.label.trim()) problems.push("The homepage card badge is empty.");
  if (s.steps.length === 0) problems.push("There are no steps.");
  if (s.steps.length > 0 && !s.stepsTitle.trim()) problems.push("The steps have no heading.");
  if (s.documents.length > 0 && !s.listTitle.trim()) problems.push("The documents list has no heading.");
  return problems;
}
export { tones };
