import { z } from "zod";

export const contentStatuses = ["draft", "scheduled", "published", "archived"] as const;
export const pageParents = ["about", "legal"] as const;

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

const titleBody = z.object({
  title: z.string().trim().min(1, "Give it a heading."),
  body: z.string().trim().min(1, "Add the words."),
});

export const aboutBlocks = z.object({
  established: z.string().trim().default(""),
  mission: z.string().trim().default(""),
  vision: z.string().trim().default(""),
  values: z.array(titleBody).default([]),
  ethics: z.array(z.string().trim().min(1, "An empty bullet shows as a blank line.")).default([]),
  quote: z
    .object({ text: z.string().trim().default(""), author: z.string().trim().default("") })
    .default({ text: "", author: "" }),
});

export const coFoundersBlocks = z.object({
  message_html: z.string().default(""),
  summary: z.string().trim().default(""),
  photo_id: mediaId,
});

export const csrBlocks = z.object({
  partners: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Name the partner."),
        photo_id: mediaId,
        logo_id: mediaId,
        line: z.string().trim().default(""),
      }),
    )
    .default([]),
});

export const careersBlocks = z.object({
  values: z.array(titleBody).default([]),
  voices: z
    .array(
      z.object({
        quote: z.string().trim().min(1, "Add the quote."),
        name: z.string().trim().min(1, "Name the person."),
        role: z.string().trim().default(""),
        photo_id: mediaId,
      }),
    )
    .default([]),
  apply_email: z
    .preprocess((v) => (v === "" || v === undefined ? null : v), z.email("That is not an email address.").nullable()),
});

export const legalBlocks = z.object({});

const BLOCKS_BY_SLUG: Record<string, z.ZodType> = {
  about: aboutBlocks,
  "message-from-co-founders": coFoundersBlocks,
  "corporate-social-responsibility": csrBlocks,
  careers: careersBlocks,
};

export function blocksSchemaFor(slug: string): z.ZodType {
  return BLOCKS_BY_SLUG[slug] ?? legalBlocks;
}

const pageFields = {
  slug: slugField,
  parent: z.enum(pageParents),
  title: z.string().trim().min(1, "Give the page a title."),
  intro: z.string().trim().default(""),
  bodyHtml: z.string().default(""),
  heroImageId: mediaId,
  showInNav: z.boolean().default(false),
  status: z.enum(contentStatuses),
  sortOrder: z.coerce.number().int().min(0).default(0),
  blocks: z.unknown(),
  ...seoFields,
};

function checkBlocks(value: { slug: string; blocks?: unknown }, ctx: z.RefinementCtx) {
  const result = blocksSchemaFor(value.slug).safeParse(value.blocks ?? {});
  if (result.success) return;
  for (const issue of result.error.issues) {
    ctx.addIssue({ code: "custom", path: ["blocks", ...issue.path], message: issue.message });
  }
}

export const createPageSchema = z.object(pageFields).superRefine(checkBlocks);
export const updatePageSchema = z.object({ id: z.uuid(), ...pageFields }).superRefine(checkBlocks);

export type PageInput = z.infer<typeof createPageSchema>;

// The About page lives at /about, its children hang off it, legal pages sit under /legal.
export function pagePath(parent: string, slug: string) {
  if (parent === "legal") return `/legal/${slug}`;
  return slug === "about" ? "/about" : `/about/${slug}`;
}

export type AttachedImage = { label: string; id: string | null; altText: string | null };

// A null alt means nobody has described the image. An empty one is a decorative image on purpose.
export function missingAltProblems(images: AttachedImage[]): string[] {
  return images
    .filter((image) => image.id !== null && image.altText === null)
    .map((image) => `${image.label} has no alt text. Describe it in Media first.`);
}

export function pagePublishProblems(page: {
  slug: string;
  title: string;
  bodyHtml: string;
  blocks: unknown;
}): string[] {
  const problems: string[] = [];
  if (!page.title.trim()) problems.push("Title is empty.");

  if (page.slug === "about") {
    const blocks = aboutBlocks.parse(page.blocks ?? {});
    if (!blocks.established) problems.push("The established line is empty.");
    if (!blocks.mission) problems.push("Mission is empty.");
    if (!blocks.vision) problems.push("Vision is empty.");
    if (blocks.ethics.length === 0) problems.push("There are no ethics bullets.");
    return problems;
  }
  if (page.slug === "message-from-co-founders") {
    const blocks = coFoundersBlocks.parse(page.blocks ?? {});
    if (!blocks.message_html.trim()) problems.push("The message is empty.");
    return problems;
  }
  if (page.slug === "corporate-social-responsibility") {
    const blocks = csrBlocks.parse(page.blocks ?? {});
    if (blocks.partners.length === 0) problems.push("There are no partners listed.");
    return problems;
  }
  if (page.slug === "careers") {
    const blocks = careersBlocks.parse(page.blocks ?? {});
    if (blocks.values.length === 0) problems.push("There are no career values listed.");
    return problems;
  }

  if (!page.bodyHtml.trim()) problems.push("The page body is empty.");
  return problems;
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

export function seoValues(data: {
  seoTitle: string;
  seoDescription: string;
  seoOgImageId: string | null;
  seoNoindex: boolean;
  canonicalUrl: string;
}) {
  return {
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    seoOgImageId: data.seoOgImageId,
    seoNoindex: data.seoNoindex,
    canonicalUrl: data.canonicalUrl || null,
  };
}

export function publishRefusal(problems: string[]) {
  return {
    ok: false as const,
    error: "This cannot go live yet. Fix these first.",
    fieldErrors: { publish: problems },
  };
}
