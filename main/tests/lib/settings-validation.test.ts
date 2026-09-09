import { test, expect } from "vitest";
import { settingsSchema, uiStringSchema } from "@/lib/validators/settings";

const valid = {
  site_name: "Goodluck Education and Migration",
  hero_image_id: "",
  hero_video_id: "",
  default_seo_title: "Study abroad with Goodluck",
  default_seo_description: "Education and migration advice for Australia and Nepal.",
  default_og_image_id: "",
  social_links: [{ label: "Facebook", href: "https://facebook.com/goodluck", icon: "facebook" }],
  notify_email_au: "info@goodluck.services",
  notify_email_np: "nepal@goodluck.services",
  ga4_id: "G-ABC1234567",
  gtm_id: "GTM-ABC1234",
  google_site_verification: "9xK2mZ0fQ7pR4tW8sB1nJ5vL3cD6yH_aE2gU0iO-kM4",
  announcement_bar: "",
  google_rating: "5.0",
  google_review_count: 125,
};

test("a full settings payload passes", () => {
  const result = settingsSchema.safeParse(valid);
  expect(result.success).toBe(true);
});

test("a hero video given as a file path instead of a media library id is refused", () => {
  expect(settingsSchema.safeParse({ ...valid, hero_video_id: "/videos/goodluck-education.mp4" }).success).toBe(false);
});

test("a bad notification address is refused", () => {
  expect(settingsSchema.safeParse({ ...valid, notify_email_np: "nepal at goodluck" }).success).toBe(false);
});

test("a social link that is not https is refused", () => {
  const link = { label: "Facebook", href: "http://facebook.com/goodluck", icon: "facebook" };
  expect(settingsSchema.safeParse({ ...valid, social_links: [link] }).success).toBe(false);
});

test("an analytics id in the wrong shape is refused", () => {
  expect(settingsSchema.safeParse({ ...valid, ga4_id: "UA-12345" }).success).toBe(false);
});

test("a pasted verification meta tag is refused", () => {
  const tag = '<meta name="google-site-verification" content="9xK2mZ0fQ7pR4tW8sB1nJ5vL3cD6yH_aE2gU0iO-kM4" />';
  expect(settingsSchema.safeParse({ ...valid, google_site_verification: tag }).success).toBe(false);
});

test("an empty verification token is allowed because the site can be verified another way", () => {
  expect(settingsSchema.safeParse({ ...valid, google_site_verification: "" }).success).toBe(true);
});

test("a rating above five is refused", () => {
  expect(settingsSchema.safeParse({ ...valid, google_rating: "6.0" }).success).toBe(false);
});

test("an empty site text value is allowed because it means fall back to the default", () => {
  expect(uiStringSchema.safeParse({ key: "nav.book_cta", value: "" }).success).toBe(true);
});
