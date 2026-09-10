import { boolean, index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { base, publishing, users } from "./core";

export const pages = pgTable("pages", {
  ...base,
  ...publishing,
  slug: text("slug").notNull().unique(),
  parent: varchar("parent", { length: 20 }).notNull().default("about"),
  title: text("title").notNull(),
  intro: text("intro"),
  bodyHtml: text("body_html"),
  blocks: jsonb("blocks"),
  showInNav: boolean("show_in_nav").notNull().default(false),
});

// Developers add keys, the admin only ever edits values.
export const uiStrings = pgTable(
  "ui_strings",
  {
    key: varchar("key", { length: 80 }).primaryKey(),
    value: text("value").notNull(),
    group: text("group").notNull(),
    label: text("label"),
    help: text("help"),
    updatedBy: text("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ui_strings_group_idx").on(t.group)],
);
