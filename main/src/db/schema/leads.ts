import { date, index, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { base, offices, users } from "./core";
import { consultationStatus, contactMethod, enquiryStatus } from "./enums";
import { destinations, services } from "./destinations";

// No created_by: nobody is signed in when a visitor submits the form.
export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").references(() => users.id),
    referenceCode: text("reference_code").notNull().unique(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    currentLocation: text("current_location"),
    destinationId: uuid("destination_id").references(() => destinations.id),
    serviceId: uuid("service_id").references(() => services.id),
    officeId: uuid("office_id").references(() => offices.id),
    message: text("message"),
    sourcePage: text("source_page"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    status: enquiryStatus("status").notNull().default("new"),
    assignedTo: text("assigned_to").references(() => users.id),
    internalNotes: text("internal_notes"),
    ipHash: text("ip_hash"),
  },
  (t) => [index("enquiries_office_status_created_idx").on(t.officeId, t.status, t.createdAt.desc())],
);

// A request, not a booking. It holds no slot, staff confirm by hand.
export const consultations = pgTable(
  "consultations",
  {
    ...base,
    referenceCode: text("reference_code").notNull().unique(),
    officeId: uuid("office_id").references(() => offices.id),
    serviceId: uuid("service_id").references(() => services.id),
    preferredDate: date("preferred_date"),
    preferredTime: time("preferred_time"),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    preferredContactMethod: contactMethod("preferred_contact_method"),
    notes: text("notes"),
    status: consultationStatus("status").notNull().default("pending"),
    assignedTo: text("assigned_to").references(() => users.id),
    internalNotes: text("internal_notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    sourcePage: text("source_page"),
    ipHash: text("ip_hash"),
  },
  (t) => [
    index("consultations_office_status_date_idx").on(t.officeId, t.status, t.preferredDate),
  ],
);
