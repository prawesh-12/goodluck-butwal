import { z } from "zod";

export const slugField = z
  .string()
  .trim()
  .min(1, "Give it a web address.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase words joined by hyphens, like study-abroad.");

// A cleared picker posts an empty string, and an empty string is not a uuid.
export const mediaId = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.uuid().nullable());

const httpsUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Use a full address starting with https://");

export const seoFields = {
  seoTitle: z.string().trim().max(70, "Keep it under 70 characters.").default(""),
  seoDescription: z.string().trim().max(160, "Keep it under 160 characters.").default(""),
  seoOgImageId: mediaId,
  seoNoindex: z.boolean().default(false),
  canonicalUrl: httpsUrl.default(""),
};

export type AttachedImage = { label: string; id: string | null; altText: string | null };

// A null alt means nobody has described the image. An empty one is a decorative image on purpose.
export function missingAltProblems(images: AttachedImage[]): string[] {
  return images
    .filter((image) => image.id !== null && image.altText === null)
    .map((image) => `${image.label} has no alt text. Describe it in Media first.`);
}
