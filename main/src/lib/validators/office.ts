import { DAY_NAMES } from "../content-meta";
import { z } from "zod";

export const contentStatuses = ["draft", "scheduled", "published", "archived"] as const;

export const text = z.string().trim().default("");

export const httpsUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("https://"), "A web address must start with https://")
  .default("");

export const optionalEmail = z
  .union([z.literal(""), z.email("Check the email address.").toLowerCase()])
  .default("");

export const e164 = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\+[1-9]\d{6,14}$/.test(v),
    "Use the international form, like +61390000000.",
  )
  .default("");

export const mediaId = z
  .union([z.literal(""), z.uuid("Choose an image from the media library.")])
  .default("");

export const slugField = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words joined by hyphens.");

const time = /^([01]\d|2[0-3]):[0-5]\d$/;


export const openingHoursSchema = z
  .array(
    z
      .object({
        day: z.number().int().min(0).max(6),
        open: z.string().trim().default(""),
        close: z.string().trim().default(""),
        closed: z.boolean(),
      })
      .refine(
        (row) => row.closed || (time.test(row.open) && time.test(row.close)),
        "Give an opening and a closing time, or mark the day closed.",
      )
      .refine(
        (row) => row.closed || row.open < row.close,
        "The closing time must be after the opening time.",
      ),
  )
  .length(7, "One row for every day of the week.")
  .refine((rows) => rows.every((row, i) => row.day === i), "Days must run Sunday to Saturday.");

export const updateOfficeSchema = z.object({
  id: z.uuid(),
  slug: slugField,
  name: z.string().trim().min(1, "The office needs a name."),
  country: z.string().trim().min(1, "Name the country."),
  timezone: z.string().trim().min(1, "Set the time zone, like Australia/Melbourne."),
  addressLine1: text,
  addressLine2: text,
  city: text,
  state: text,
  postcode: text,
  phone: e164,
  phoneDisplay: text,
  whatsapp: e164,
  email: optionalEmail,
  mapsUrl: httpsUrl,
  mapsEmbedUrl: httpsUrl,
  openingHours: openingHoursSchema,
  profileHtml: z.string().default(""),
  credentialsHtml: z.string().default(""),
  heroImageId: mediaId,
  isActive: z.boolean(),
  status: z.enum(contentStatuses),
  seoTitle: text,
  seoDescription: text,
  seoOgImageId: mediaId,
  seoNoindex: z.boolean(),
  canonicalUrl: httpsUrl,
});

export type OfficeInput = z.infer<typeof updateOfficeSchema>;

export type AltText = { hero?: string | null; shareImage?: string | null };

// Everything the contact cards, the header and the footer read. Named one by one so the answer
// is a list to fix, not "invalid".
export function officePublishProblems(data: OfficeInput, alt: AltText): string[] {
  const missing: string[] = [];
  if (!data.city) missing.push("City");
  if (!data.addressLine1) missing.push("Street address");
  if (!data.phone) missing.push("Phone number");
  if (!data.phoneDisplay) missing.push("Phone number as written on the site");
  if (!data.email) missing.push("Email address");
  if (!data.openingHours.some((row) => !row.closed)) missing.push("At least one open day");
  if (data.heroImageId && !alt.hero) missing.push("Alt text on the hero image");
  if (data.seoOgImageId && !alt.shareImage) missing.push("Alt text on the share image");
  return missing;
}
export { DAY_NAMES };
