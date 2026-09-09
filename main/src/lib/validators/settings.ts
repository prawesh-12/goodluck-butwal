import { z } from "zod";

const httpsUrl = z
  .url("Check the web address.")
  .refine((value) => value.startsWith("https://"), "A web address must start with https://");

export const socialLinkSchema = z.object({
  label: z.string().trim().min(1, "Give the link a name."),
  href: httpsUrl,
  icon: z.string(),
});

export const settingsSchema = z.object({
  site_name: z.string().trim().min(1, "The site needs a name."),
  hero_image_id: z.uuid("That is not a media library id.").or(z.literal("")),
  hero_video_id: z.uuid("That is not a media library id.").or(z.literal("")),
  default_seo_title: z.string().trim(),
  default_seo_description: z.string().trim(),
  default_og_image_id: z.uuid("That is not a media library id.").or(z.literal("")),
  social_links: z.array(socialLinkSchema),
  notify_email_au: z.email("Check the Australia address.").toLowerCase(),
  notify_email_np: z.email("Check the Nepal address.").toLowerCase(),
  ga4_id: z.string().trim().regex(/^(G-[A-Z0-9]+)?$/, "A GA4 id looks like G-XXXXXXXXXX."),
  gtm_id: z.string().trim().regex(/^(GTM-[A-Z0-9]+)?$/, "A GTM id looks like GTM-XXXXXXX."),
  google_site_verification: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]*$/, "Paste only the content value from the tag, not the whole tag."),
  announcement_bar: z.string().trim(),
  google_rating: z.string().trim().regex(/^([0-5](\.\d)?)?$/, "A rating runs from 0 to 5, like 4.8."),
  google_review_count: z.coerce.number().int().min(0, "A review count cannot be negative."),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;

// A blank value means "show the seeded text again", so it passes here and the action decides.
export const uiStringSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string(),
});
