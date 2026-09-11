import { boolean, index, integer, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { base, publishing } from "./core";
import { officeScope, serviceCategory } from "./enums";

export const destinations = pgTable(
  "destinations",
  {
    ...base,
    ...publishing,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    countryCode: text("country_code"),
    tagline: text("tagline"),
    factPill: text("fact_pill"),
    overviewHtml: text("overview_html"),
    academicHtml: text("academic_html"),
    workHtml: text("work_html"),
    isFeatured: boolean("is_featured").notNull().default(false),
    // false renders the card but routes it to the booking form, which is New Zealand today.
    hasPage: boolean("has_page").notNull().default(true),
    highlights: jsonb("highlights").$type<{ label: string; value: string; note?: string }[]>(),
    why: jsonb("why").$type<{ text: string }[]>(),
    checklist: jsonb("checklist").$type<{ text: string }[]>(),
    intakes: jsonb("intakes").$type<{ month: string; note?: string }[]>(),
    migration: jsonb("migration").$type<{ title: string; body: string; icon?: string }[]>(),
    costs: jsonb("costs").$type<
      { label: string; amount: number; currency: string; note?: string }[]
    >(),
    help: jsonb("help").$type<{ title: string; body: string }[]>(),
  },
  (t) => [index("destinations_status_sort_idx").on(t.status, t.sortOrder)],
);

export const destinationFaqs = pgTable("destination_faqs", {
  ...base,
  destinationId: uuid("destination_id")
    .notNull()
    .references(() => destinations.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answerHtml: text("answer_html").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const services = pgTable(
  "services",
  {
    ...base,
    ...publishing,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    category: serviceCategory("category").notNull(),
    officeScope: officeScope("office_scope").notNull().default("both"),
    summary: text("summary"),
    introHtml: text("intro_html"),
    steps: jsonb("steps").$type<{ title: string; body: string }[]>(),
    facts: jsonb("facts").$type<{ label: string; value: string }[]>(),
    documents: jsonb("documents").$type<{ label: string }[]>(),
    tone: varchar("tone", { length: 20 }),
    isFeatured: boolean("is_featured").notNull().default(false),
  },
  (t) => [
    index("services_category_status_idx").on(t.category, t.status),
    index("services_scope_status_idx").on(t.officeScope, t.status),
  ],
);

export const serviceFaqs = pgTable("service_faqs", {
  ...base,
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answerHtml: text("answer_html").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
