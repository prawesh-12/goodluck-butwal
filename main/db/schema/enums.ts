import { pgEnum } from "drizzle-orm/pg-core";

export const contentStatus = pgEnum("content_status", [
  "draft",
  "scheduled",
  "published",
  "archived",
]);

export const userRole = pgEnum("user_role", [
  "super_admin",
  "au_admin",
  "np_admin",
  "content_editor",
]);

export const mediaKind = pgEnum("media_kind", ["static", "cloudinary"]);

export const officeScope = pgEnum("office_scope", ["both", "au", "np"]);

export const serviceCategory = pgEnum("service_category", [
  "education",
  "study_abroad",
  "test_prep",
  "migration",
]);

export const qualificationLevel = pgEnum("qualification_level", [
  "foundation",
  "english_language",
  "certificate",
  "diploma",
  "advanced_diploma",
  "bachelor",
  "graduate_certificate",
  "graduate_diploma",
  "master",
  "doctorate",
]);

export const testType = pgEnum("test_type", ["ielts", "pte"]);

export const batchMode = pgEnum("batch_mode", ["in_person", "online", "hybrid"]);

export const batchStatus = pgEnum("batch_status", [
  "open",
  "filling_fast",
  "full",
  "closed",
  "completed",
]);

export const eventType = pgEnum("event_type", [
  "seminar",
  "education_fair",
  "webinar",
  "workshop",
  "info_session",
]);

export const regStatus = pgEnum("reg_status", ["registered", "attended", "cancelled"]);

export const testimonialType = pgEnum("testimonial_type", ["text", "image", "video"]);

export const videoProvider = pgEnum("video_provider", ["youtube", "vimeo", "local"]);

export const contactMethod = pgEnum("contact_method", ["email", "phone", "whatsapp"]);

export const consultationStatus = pgEnum("consultation_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const enquiryStatus = pgEnum("enquiry_status", [
  "new",
  "in_progress",
  "contacted",
  "converted",
  "closed",
  "spam",
]);

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "publish",
  "unpublish",
  "login",
  "login_failed",
  "export",
]);
