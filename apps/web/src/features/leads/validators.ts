import { z } from "zod";

// Kept loose: the offices take calls from everywhere and a rejected number loses a lead.
const phone = z
  .string()
  .trim()
  .regex(/^[+(0-9][0-9 ()\-.]{5,24}$/, "That does not look like a phone number.")
  .optional()
  .or(z.literal(""));

const shared = {
  fullName: z.string().trim().min(1, "Tell us your name."),
  email: z.email("Check the email address.").toLowerCase(),
  phone,
  sourcePage: z.string().optional(),
  referrer: z.string().optional(),
  turnstileToken: z.string().optional(),
  // Real people leave this empty. Bots fill everything in.
  company_website: z.string().optional(),
};

export const enquirySchema = z.object({
  ...shared,
  currentLocation: z.string().trim().optional(),
  destinationSlug: z.string().optional(),
  serviceSlug: z.string().optional(),
  officeCode: z.string().optional(),
  message: z.string().trim().min(1, "Tell us what you need."),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export const consultationSchema = z.object({
  ...shared,
  officeCode: z.string().min(1, "Choose an office."),
  serviceSlug: z.string().min(1, "Choose a service."),
  preferredDate: z.iso.date("Choose a date."),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).optional(),
  notes: z.string().trim().optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type ConsultationInput = z.infer<typeof consultationSchema>;
