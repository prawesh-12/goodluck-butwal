// users, offices and media_assets reference each other, and TypeScript cannot infer a table
// type across a file cycle, so these three must stay in one module.
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { contentStatus, mediaKind, userRole } from "./enums";

export const base = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by").references((): AnyPgColumn => users.id),
  updatedBy: text("updated_by").references((): AnyPgColumn => users.id),
};

export const publishing = {
  status: contentStatus("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("member"),
  officeId: uuid("office_id").references((): AnyPgColumn => offices.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

type OpeningHours = { day: number; open: string; close: string; closed: boolean }[];

export const offices = pgTable("offices", {
  ...base,
  ...publishing,
  slug: text("slug").notNull().unique(),
  code: varchar("code", { length: 2 }).notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  timezone: text("timezone").notNull(),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postcode: text("postcode"),
  phone: text("phone"),
  phoneDisplay: text("phone_display"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  mapsUrl: text("maps_url"),
  mapsEmbedUrl: text("maps_embed_url"),
  openingHours: jsonb("opening_hours").$type<OpeningHours>(),
  profileHtml: text("profile_html"),
  credentialsHtml: text("credentials_html"),
  isActive: boolean("is_active").notNull().default(true),
});

export const mediaAssets = pgTable(
  "media_assets",
  {
    ...base,
    kind: mediaKind("kind").notNull(),
    type: text("type").notNull(),
    staticPath: text("static_path"),
    cloudinaryPublicId: text("cloudinary_public_id"),
    filename: text("filename"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text"),
    caption: text("caption"),
    folder: text("folder").notNull().default("general"),
    officeId: uuid("office_id").references(() => offices.id),
    uploadedBy: text("uploaded_by").references(() => users.id),
  },
  (t) => [
    index("media_assets_kind_folder_created_idx").on(t.kind, t.folder, t.createdAt.desc()),
    // Postgres allows many nulls here, so Cloudinary rows are unaffected.
    uniqueIndex("media_assets_static_path_idx").on(t.staticPath),
  ],
);
