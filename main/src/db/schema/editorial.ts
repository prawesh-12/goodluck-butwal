import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { base, mediaAssets, offices, publishing, seo, users } from "./core";
import { eventType, regStatus, testimonialType, videoProvider } from "./enums";
import { destinations, services } from "./destinations";
import { institutions } from "./institutions";

export const postCategories = pgTable("post_categories", {
  ...base,
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const tags = pgTable("tags", {
  ...base,
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.tagId] }),
    index("post_tags_tag_idx").on(t.tagId),
  ],
);

export const posts = pgTable(
  "posts",
  {
    ...base,
    ...publishing,
    ...seo,
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    bodyHtml: text("body_html"),
    bannerImageId: uuid("banner_image_id").references(() => mediaAssets.id),
    categoryId: uuid("category_id").references(() => postCategories.id),
    // null means the post belongs to both offices.
    officeId: uuid("office_id").references(() => offices.id),
    destinationId: uuid("destination_id").references(() => destinations.id),
    authorId: text("author_id").references(() => users.id),
    authorDisplayName: text("author_display_name"),
    readingMinutes: integer("reading_minutes"),
  },
  (t) => [
    index("posts_status_published_idx").on(t.status, t.publishedAt.desc()),
    index("posts_category_status_idx").on(t.categoryId, t.status),
  ],
);

export const events = pgTable(
  "events",
  {
    ...base,
    ...publishing,
    ...seo,
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    eventType: eventType("event_type").notNull(),
    officeId: uuid("office_id").references(() => offices.id),
    summary: text("summary"),
    descriptionHtml: text("description_html"),
    coverImageId: uuid("cover_image_id").references(() => mediaAssets.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isOnline: boolean("is_online").notNull().default(false),
    onlineUrl: text("online_url"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    mapsEmbedUrl: text("maps_embed_url"),
    capacity: integer("capacity"),
    registrationEnabled: boolean("registration_enabled").notNull().default(true),
    registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  },
  (t) => [index("events_office_starts_idx").on(t.officeId, t.startsAt)],
);

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    ...base,
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    attendees: integer("attendees").notNull().default(1),
    notes: text("notes"),
    status: regStatus("status").notNull().default("registered"),
    sourcePage: text("source_page"),
    ipHash: text("ip_hash"),
  },
  (t) => [
    uniqueIndex("event_registrations_event_email_idx").on(t.eventId, sql`lower(${t.email})`),
  ],
);

export const testimonials = pgTable(
  "testimonials",
  {
    ...base,
    ...publishing,
    type: testimonialType("type").notNull().default("text"),
    // author_name stays admin-only when anonymised, display_name is what the public sees.
    authorName: text("author_name"),
    displayName: text("display_name"),
    isAnonymised: boolean("is_anonymised").notNull().default(false),
    authorPhotoId: uuid("author_photo_id").references(() => mediaAssets.id),
    authorLocation: text("author_location"),
    quote: text("quote"),
    bodyHtml: text("body_html"),
    imageId: uuid("image_id").references(() => mediaAssets.id),
    videoUrl: text("video_url"),
    videoProvider: videoProvider("video_provider"),
    destinationId: uuid("destination_id").references(() => destinations.id),
    institutionId: uuid("institution_id").references(() => institutions.id),
    serviceId: uuid("service_id").references(() => services.id),
    officeId: uuid("office_id").references(() => offices.id),
    rating: smallint("rating"),
    isFeatured: boolean("is_featured").notNull().default(false),
  },
  (t) => [index("testimonials_status_featured_type_idx").on(t.status, t.isFeatured, t.type)],
);
