import { EXCERPT_MAX } from "@/config/content-meta";
import { z } from "zod";
import { contentStatuses, mediaId, slugField, text } from "@/lib/validators/fields";


const slugOrBlank = z.union([z.literal(""), slugField]).default("");

const optionalId = z.union([z.literal(""), z.uuid("Choose one from the list.")]).default("");

const fields = {
  title: z.string().trim().min(1, "Give the post a title."),
  slug: slugOrBlank,
  excerpt: z
    .string()
    .trim()
    .max(EXCERPT_MAX, `Keep the excerpt to ${EXCERPT_MAX} characters or fewer.`)
    .default(""),
  bodyHtml: z.string().default(""),
  bannerImageId: mediaId,
  categoryId: optionalId,
  officeId: optionalId,
  destinationId: optionalId,
  tagIds: z.array(z.uuid()).default([]),
  authorDisplayName: text,
  status: z.enum(contentStatuses),
};

export const createPostSchema = z.object(fields);
export const updatePostSchema = z.object({ id: z.uuid(), ...fields });

export type PostInput = z.infer<typeof createPostSchema>;

export type PostAltText = { banner?: string | null };

// Same arithmetic as the migrated rows, so a re-saved article keeps the number it shipped with.
export function readingMinutes(html: string) {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function bodyImagesMissingAlt(html: string): string[] {
  const found: string[] = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const alt = /\balt\s*=\s*"([^"]*)"/i.exec(tag) ?? /\balt\s*=\s*'([^']*)'/i.exec(tag);
    if (alt?.[1].trim()) continue;
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    found.push(src.split("/").pop() || "an image in the body");
  }
  return found;
}

export function postPublishProblems(data: PostInput, alt: PostAltText): string[] {
  const missing: string[] = [];
  if (!data.excerpt) missing.push("Excerpt");
  if (!data.bodyHtml.trim()) missing.push("Body");
  if (!data.categoryId) missing.push("Category");
  if (!data.bannerImageId) missing.push("Banner image");
  if (data.bannerImageId && !alt.banner) missing.push("Alt text on the banner image");
  for (const name of bodyImagesMissingAlt(data.bodyHtml)) {
    missing.push(`Alt text on ${name} in the body`);
  }
  return missing;
}

const categoryFields = {
  name: z.string().trim().min(1, "Give the category a name."),
  slug: slugOrBlank,
  description: text,
  sortOrder: z.number().int().min(0).default(0),
};

export const createPostCategorySchema = z.object(categoryFields);
export const updatePostCategorySchema = z.object({ id: z.uuid(), ...categoryFields });

const tagFields = {
  name: z.string().trim().min(1, "Give the tag a name."),
  slug: slugOrBlank,
};

export const createTagSchema = z.object(tagFields);
export const updateTagSchema = z.object({ id: z.uuid(), ...tagFields });
export { EXCERPT_MAX };
