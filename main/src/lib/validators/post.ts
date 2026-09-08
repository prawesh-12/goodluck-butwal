import { z } from "zod";
import { contentStatuses, httpsUrl, mediaId, slugField, text } from "./office";

export const EXCERPT_MAX = 200;

const slugOrBlank = z.union([z.literal(""), slugField]).default("");

const optionalId = z.union([z.literal(""), z.uuid("Choose one from the list.")]).default("");

const goLiveAt = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Choose a date and a time.")
  .default("");

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
  publishedAt: goLiveAt,
  seoTitle: text,
  seoDescription: text,
  seoOgImageId: mediaId,
  seoNoindex: z.boolean().default(false),
  canonicalUrl: httpsUrl,
};

function checkSchedule(
  data: { status: string; publishedAt: string },
  ctx: z.RefinementCtx,
) {
  if (data.status !== "scheduled") return;
  if (!data.publishedAt) {
    ctx.addIssue({
      code: "custom",
      path: ["publishedAt"],
      message: "A scheduled post needs the date and time it should go live.",
    });
    return;
  }
  if (Date.parse(data.publishedAt) <= Date.now()) {
    ctx.addIssue({
      code: "custom",
      path: ["publishedAt"],
      message: "Pick a time in the future, or publish it now.",
    });
  }
}

export const createPostSchema = z.object(fields).superRefine(checkSchedule);
export const updatePostSchema = z.object({ id: z.uuid(), ...fields }).superRefine(checkSchedule);

export type PostInput = z.infer<typeof createPostSchema>;

export type PostAltText = { banner?: string | null; shareImage?: string | null };

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
  if (data.seoOgImageId && !alt.shareImage) missing.push("Alt text on the share image");
  for (const name of bodyImagesMissingAlt(data.bodyHtml)) {
    missing.push(`Alt text on ${name} in the body`);
  }
  return missing;
}

// The 31 migrated slugs are live URLs, so a rename leaves a 301 behind rather than a dead link.
export function redirectForRename(oldSlug: string, newSlug: string, wasPublished: boolean) {
  if (!wasPublished || oldSlug === newSlug) return null;
  return {
    fromPath: `/news/${oldSlug}`,
    toPath: `/news/${newSlug}`,
    statusCode: 301,
    note: `The post moved from ${oldSlug}.`,
  };
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
