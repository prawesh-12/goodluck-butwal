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
