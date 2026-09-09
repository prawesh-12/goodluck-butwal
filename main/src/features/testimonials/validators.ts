import { z } from "zod";
import { contentStatuses, httpsUrl, mediaId, text } from "@/lib/validators/fields";
import {
  requiredFieldsFor,
  testimonialTypes,
  videoProviders,
  type RequiredField,
  type Requirement,
  type TestimonialType,
} from "@/config/content-meta";

export { requiredFieldsFor, testimonialTypes, videoProviders };
export type { RequiredField, Requirement, TestimonialType };

const optionalId = z.union([z.literal(""), z.uuid("Choose one from the list.")]).default("");

const goLiveAt = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Choose a date and a time.")
  .default("");


const fields = {
  type: z.enum(testimonialTypes),
  authorName: text,
  displayName: text,
  isAnonymised: z.boolean().default(false),
  authorPhotoId: mediaId,
  authorLocation: text,
  quote: z.string().trim().default(""),
  bodyHtml: z.string().default(""),
  imageId: mediaId,
  videoUrl: httpsUrl,
  videoProvider: z.union([z.literal(""), z.enum(videoProviders)]).default(""),
  destinationId: optionalId,
  institutionId: optionalId,
  serviceId: optionalId,
  officeId: optionalId,
  rating: z.number().int().min(1, "A rating runs from 1 to 5.").max(5, "A rating runs from 1 to 5.").nullable().default(null),
  isFeatured: z.boolean().default(false),
  status: z.enum(contentStatuses),
  publishedAt: goLiveAt,
};

type Core = {
  type: TestimonialType;
  quote: string;
  imageId: string;
  videoUrl: string;
  videoProvider: string;
};

function valueOf(data: Core, field: RequiredField) {
  switch (field) {
    case "quote":
      return data.quote;
    case "imageId":
      return data.imageId;
    case "videoUrl":
      return data.videoUrl;
    case "videoProvider":
      return data.videoProvider;
  }
}

export function missingForType(data: Core): Requirement[] {
  return requiredFieldsFor(data.type).filter((need) => !(valueOf(data, need.field) ?? "").trim());
}

function checkFields(
  data: Core & {
    status: string;
    publishedAt: string;
    isAnonymised: boolean;
    authorName: string;
    displayName: string;
  },
  ctx: z.RefinementCtx,
) {
  for (const need of missingForType(data)) {
    ctx.addIssue({ code: "custom", path: [need.field], message: need.message });
  }

  if (data.isAnonymised) {
    if (!data.displayName) {
      ctx.addIssue({
        code: "custom",
        path: ["displayName"],
        message: "An anonymised story still needs a name to show, such as a first name or initials.",
      });
    } else if (data.displayName.toLowerCase() === data.authorName.toLowerCase()) {
      ctx.addIssue({
        code: "custom",
        path: ["displayName"],
        message: "The shown name must be different from the real name.",
      });
    }
  }

  if (data.status === "scheduled") {
    if (!data.publishedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "A scheduled story needs the date and time it should go live.",
      });
    } else if (Date.parse(data.publishedAt) <= Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "Pick a time in the future, or publish it now.",
      });
    }
  }
}

export const createTestimonialSchema = z.object(fields).superRefine(checkFields);
export const updateTestimonialSchema = z
  .object({ id: z.uuid(), ...fields })
  .superRefine(checkFields);

export type TestimonialInput = z.infer<typeof createTestimonialSchema>;

// Anonymised rows never carry the real name or the face to the public columns.
export function publicIdentity(data: {
  isAnonymised: boolean;
  authorName: string;
  displayName: string;
  authorPhotoId: string;
}) {
  if (data.isAnonymised) return { displayName: data.displayName, authorPhotoId: null };
  return {
    displayName: data.displayName || data.authorName,
    authorPhotoId: data.authorPhotoId || null,
  };
}

export type TestimonialAltText = { image?: string | null; photo?: string | null };

export function testimonialPublishProblems(
  data: TestimonialInput,
  alt: TestimonialAltText,
): string[] {
  const problems: string[] = [];
  for (const need of missingForType(data)) problems.push(need.message);
  if (!data.displayName && !data.authorName) {
    problems.push("Give the name the public should see.");
  }
  if (data.imageId && !alt.image) problems.push("Add alt text to the image.");
  if (!data.isAnonymised && data.authorPhotoId && !alt.photo) {
    problems.push("Add alt text to the author photo.");
  }
  return problems;
}
