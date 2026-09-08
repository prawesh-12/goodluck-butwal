import { z } from "zod";
import { contentStatuses, mediaId, seoFields, slugField } from "./page";

export const highlightItem = z.object({
  label: z.string().trim().min(1, "Give the highlight a label."),
  value: z.string().trim().min(1, "Add the value."),
  note: z.string().trim().default(""),
});

export const whyItem = z.object({ text: z.string().trim().min(1, "An empty reason shows as a blank line.") });

export const checklistItem = z.object({ text: z.string().trim().min(1, "An empty step shows as a blank line.") });

export const intakeItem = z.object({
  month: z.string().trim().min(1, "Name the intake month."),
  note: z.string().trim().default(""),
});

export const migrationItem = z.object({
  title: z.string().trim().min(1, "Give the block a heading."),
  body: z.string().trim().min(1, "Add the words."),
  icon: z.string().trim().default(""),
});

export const costItem = z.object({
  label: z.string().trim().min(1, "Name what the cost is for."),
  amount: z.coerce.number().min(0, "Use a number, zero or more."),
  currency: z.string().trim().toUpperCase().length(3, "Three letters, like AUD."),
  note: z.string().trim().default(""),
});

export const helpItem = z.object({
  title: z.string().trim().min(1, "Give the block a heading."),
  body: z.string().trim().min(1, "Add the words."),
});

export const destinationBlocks = z.object({
  highlights: z.array(highlightItem).default([]),
  why: z.array(whyItem).default([]),
  checklist: z.array(checklistItem).default([]),
  intakes: z.array(intakeItem).default([]),
  migration: z.array(migrationItem).default([]),
  costs: z.array(costItem).default([]),
  help: z.array(helpItem).default([]),
});

const destinationFields = {
  slug: slugField,
  name: z.string().trim().min(1, "Give the destination a name."),
  countryCode: z.string().trim().toUpperCase().max(2, "Two letters, like AU.").default(""),
  tagline: z.string().trim().default(""),
  heroImageId: mediaId,
  flagImageId: mediaId,
  cardImageId: mediaId,
  factPill: z.string().trim().default(""),
  overviewHtml: z.string().default(""),
  academicHtml: z.string().default(""),
  workHtml: z.string().default(""),
  isFeatured: z.boolean().default(false),
  hasPage: z.boolean().default(true),
  status: z.enum(contentStatuses),
  sortOrder: z.coerce.number().int().min(0).default(0),
  // No column of their own, they are saved as interface text keyed on the slug.
  migrationTitle: z.string().trim().default(""),
  whyTitle: z.string().trim().default(""),
  checklistTitle: z.string().trim().default(""),
  ...destinationBlocks.shape,
  ...seoFields,
};

export const createDestinationSchema = z.object(destinationFields);
export const updateDestinationSchema = z.object({ id: z.uuid(), ...destinationFields });

export type DestinationInput = z.infer<typeof createDestinationSchema>;

export function destinationPath(slug: string) {
  return `/study-abroad/${slug}`;
}

export function destinationPublishProblems(d: {
  name: string;
  hasPage: boolean;
  overviewHtml: string;
  heroImageId: string | null;
  cardImageId: string | null;
  flagImageId: string | null;
  highlights: unknown[];
  why: unknown[];
  migration: unknown[];
  help: unknown[];
  checklist: unknown[];
  whyTitle: string;
  migrationTitle: string;
  checklistTitle: string;
}): string[] {
  const problems: string[] = [];
  if (!d.name.trim()) problems.push("Name is empty.");
  if (!d.cardImageId) problems.push("There is no card image for the homepage.");

  // A destination without a page of its own is only ever a card routed to the booking form.
  if (!d.hasPage) return problems;

  if (!d.flagImageId) problems.push("There is no flag image.");
  if (!d.heroImageId) problems.push("There is no hero image.");
  if (!d.overviewHtml.trim()) problems.push("The overview is empty.");
  if (d.highlights.length === 0) problems.push("There are no highlights.");
  if (d.why.length === 0) problems.push("There are no reasons to study there.");
  if (d.why.length > 0 && !d.whyTitle.trim()) problems.push("The reasons list has no heading.");
  if (d.migration.length === 0) problems.push("There are no migration blocks.");
  if (d.migration.length > 0 && !d.migrationTitle.trim()) problems.push("The migration blocks have no heading.");
  if (d.checklist.length > 0 && !d.checklistTitle.trim()) problems.push("The checklist has no heading.");
  if (d.help.length === 0) problems.push("There are no help blocks.");
  return problems;
}
