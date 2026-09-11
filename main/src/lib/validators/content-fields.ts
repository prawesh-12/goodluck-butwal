import { z } from "zod";

export const slugField = z
  .string()
  .trim()
  .min(1, "Give it a web address.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase words joined by hyphens, like study-abroad.");

// A cleared picker posts an empty string, and an empty string is not a uuid.
export const mediaId = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.uuid().nullable());

export type AttachedImage = { label: string; id: string | null; altText: string | null };

// A null alt means nobody has described the image. An empty one is a decorative image on purpose.
export function missingAltProblems(images: AttachedImage[]): string[] {
  return images
    .filter((image) => image.id !== null && image.altText === null)
    .map((image) => `${image.label} has no alt text. Describe it in Images first.`);
}

export type SlugRedirect = {
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  note: string;
};

// Live addresses are linked from elsewhere, so a rename leaves a 301 behind rather than a 404.
export function slugRedirect(before: string, after: string, wasPublished: boolean): SlugRedirect | null {
  if (!wasPublished || before === after) return null;
  return {
    fromPath: before,
    toPath: after,
    statusCode: 301,
    isActive: true,
    note: `Address changed from ${before} to ${after}`,
  };
}

export function publishRefusal(problems: string[]) {
  return {
    ok: false as const,
    error: "This cannot go live yet. Fix these first.",
    fieldErrors: { publish: problems },
  };
}
