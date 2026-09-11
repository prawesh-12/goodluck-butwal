import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { base, mediaAssets, offices, publishing } from "./core";
import { institutions } from "./institutions";

export const teamMembers = pgTable(
  "team_members",
  {
    ...base,
    ...publishing,
    officeId: uuid("office_id").references(() => offices.id),
    slug: text("slug").notNull().unique(),
    fullName: text("full_name").notNull(),
    position: text("position"),
    photoId: uuid("photo_id").references(() => mediaAssets.id),
    bioHtml: text("bio_html"),
    qualifications: text("qualifications").array(),
    expertise: text("expertise").array(),
    email: text("email"),
    phone: text("phone"),
    linkedinUrl: text("linkedin_url"),
    isCoFounder: boolean("is_co_founder").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
  },
  (t) => [index("team_members_office_status_idx").on(t.officeId, t.status)],
);

export const partners = pgTable(
  "partners",
  {
    ...base,
    ...publishing,
    name: text("name").notNull(),
    logoId: uuid("logo_id").references(() => mediaAssets.id),
    websiteUrl: text("website_url"),
    institutionId: uuid("institution_id").references(() => institutions.id),
    isFeatured: boolean("is_featured").notNull().default(false),
  },
  (t) => [index("partners_status_sort_idx").on(t.status, t.sortOrder)],
);
