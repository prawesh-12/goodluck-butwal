import { boolean, char, index, integer, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { base, mediaAssets, publishing, seo } from "./core";
import { qualificationLevel } from "./enums";
import { destinations } from "./destinations";

export const institutions = pgTable(
  "institutions",
  {
    ...base,
    ...publishing,
    ...seo,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    logoId: uuid("logo_id").references(() => mediaAssets.id),
    destinationId: uuid("destination_id").references(() => destinations.id),
    country: text("country"),
    city: text("city"),
    websiteUrl: text("website_url"),
    descriptionHtml: text("description_html"),
    isPartner: boolean("is_partner").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
  },
  (t) => [index("institutions_destination_status_idx").on(t.destinationId, t.status)],
);

export const institutionImages = pgTable("institution_images", {
  ...base,
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  mediaId: uuid("media_id")
    .notNull()
    .references(() => mediaAssets.id),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const courseCategories = pgTable("course_categories", {
  ...base,
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const courses = pgTable(
  "courses",
  {
    ...base,
    ...publishing,
    ...seo,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    destinationId: uuid("destination_id").references(() => destinations.id),
    country: text("country"),
    qualificationLevel: qualificationLevel("qualification_level"),
    categoryId: uuid("category_id").references(() => courseCategories.id),
    durationMonths: integer("duration_months"),
    durationLabel: text("duration_label"),
    intakes: text("intakes").array(),
    tuitionFeeMin: numeric("tuition_fee_min", { precision: 12, scale: 2 }),
    tuitionFeeMax: numeric("tuition_fee_max", { precision: 12, scale: 2 }),
    tuitionCurrency: char("tuition_currency", { length: 3 }),
    descriptionHtml: text("description_html"),
    entryRequirementsHtml: text("entry_requirements_html"),
  },
  (t) => [
    index("courses_institution_idx").on(t.institutionId),
    index("courses_destination_level_category_idx").on(
      t.destinationId,
      t.qualificationLevel,
      t.categoryId,
    ),
  ],
);
