import { z } from "zod";
import { institutionPath } from "@/components/admin/course-meta";
import { contentStatuses, mediaId, missingAltProblems, seoFields, slugField, type AttachedImage } from "./page";

const httpsUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Use a full address starting with https://");

const fields = {
  slug: slugField,
  name: z.string().trim().min(1, "Give the institution a name."),
  logoId: mediaId,
  destinationId: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.uuid().nullable()),
  country: z.string().trim().default(""),
  city: z.string().trim().default(""),
  websiteUrl: httpsUrl.default(""),
  descriptionHtml: z.string().default(""),
  isPartner: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: z.enum(contentStatuses),
  sortOrder: z.coerce.number().int().min(0).default(0),
  ...seoFields,
};

export const createInstitutionSchema = z.object(fields);
export const updateInstitutionSchema = z.object({ id: z.uuid(), ...fields });

export type InstitutionInput = z.infer<typeof createInstitutionSchema>;

const galleryItemSchema = z.object({
  id: z.uuid().optional(),
  mediaId: z.uuid("Choose a picture from the media library."),
  caption: z.string().trim().default(""),
});

export const institutionGallerySchema = z.object({
  institutionId: z.uuid(),
  items: z.array(galleryItemSchema).default([]),
});

export type InstitutionPublishFields = {
  name: string;
  country: string;
  descriptionHtml: string;
  logoId: string | null;
};

// Names every missing field rather than stopping at the first, so the editor fixes them in one go.
export function institutionPublishProblems(
  data: InstitutionPublishFields,
  images: AttachedImage[] = [],
): string[] {
  const problems: string[] = [];
  if (!data.name.trim()) problems.push("Name is empty.");
  if (!data.country.trim()) problems.push("Country is empty.");
  if (!data.descriptionHtml.trim()) problems.push("The description is empty.");
  if (!data.logoId) problems.push("There is no logo.");
  return [...problems, ...missingAltProblems(images)];
}

// Partner rows carry no institution of their own, so the two are matched on the name alone.
export function normaliseName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchPartnersToInstitutions(
  partners: { id: string; name: string; institutionId: string | null }[],
  institutions: { id: string; name: string }[],
): { partnerId: string; institutionId: string }[] {
  const byName = new Map(institutions.map((row) => [normaliseName(row.name), row.id]));
  const pairs: { partnerId: string; institutionId: string }[] = [];
  for (const partner of partners) {
    const institutionId = byName.get(normaliseName(partner.name));
    if (institutionId && institutionId !== partner.institutionId) {
      pairs.push({ partnerId: partner.id, institutionId });
    }
  }
  return pairs;
}

export { institutionPath };
