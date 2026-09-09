import { z } from "zod";
import { contentStatuses, e164, httpsUrl, mediaId, optionalEmail, slugField, text } from "@/lib/validators/fields";

const tags = z
  .array(z.string())
  .transform((list) => list.map((item) => item.trim()).filter(Boolean))
  .default([]);

const fields = {
  officeId: z.union([z.literal(""), z.uuid()]).default(""),
  slug: slugField.or(z.literal("")).default(""),
  fullName: z.string().trim().min(1, "Give the person a name."),
  position: text,
  photoId: mediaId,
  bioHtml: z.string().default(""),
  qualifications: tags,
  expertise: tags,
  email: optionalEmail,
  phone: e164,
  linkedinUrl: httpsUrl,
  isCoFounder: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: z.enum(contentStatuses),
  seoTitle: text,
  seoDescription: text,
  seoOgImageId: mediaId,
  seoNoindex: z.boolean().default(false),
  canonicalUrl: httpsUrl,
};

export const createTeamMemberSchema = z.object(fields);
export const updateTeamMemberSchema = z.object({ id: z.uuid(), ...fields });

export const reorderTeamSchema = z.object({ ids: z.array(z.uuid()).min(1) });

export type TeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export type TeamAltText = { photo?: string | null; shareImage?: string | null };

export function teamPublishProblems(data: TeamMemberInput, alt: TeamAltText): string[] {
  const missing: string[] = [];
  if (!data.position) missing.push("Position");
  if (!data.officeId) missing.push("Office");
  if (!data.photoId) missing.push("Photo");
  if (data.photoId && !alt.photo) missing.push("Alt text on the photo");
  if (data.seoOgImageId && !alt.shareImage) missing.push("Alt text on the share image");
  return missing;
}
