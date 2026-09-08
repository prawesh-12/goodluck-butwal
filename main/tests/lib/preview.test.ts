import { expect, test } from "vitest";
import { adminUrlForPath, previewMetadata, previewPath } from "@/lib/preview";

test("a news article maps to the post editor", () => {
  expect(adminUrlForPath("/news/melbourne-intake-2026")).toBe("/admin/posts?q=melbourne-intake-2026");
});

test("a course page maps to the course editor", () => {
  expect(adminUrlForPath("/courses/master-of-nursing")).toBe("/admin/courses?q=master-of-nursing");
});

test("an event page maps to the event editor", () => {
  expect(adminUrlForPath("/events/butwal-education-fair")).toBe("/admin/events?q=butwal-education-fair");
});

test("a destination page maps to the destination editor", () => {
  expect(adminUrlForPath("/study-abroad/australia")).toBe("/admin/destinations?q=australia");
});

test("a listing page maps to its list, not to a record", () => {
  expect(adminUrlForPath("/news")).toBe("/admin/posts");
  expect(adminUrlForPath("/news/tag/visas")).toBe("/admin/posts");
});

test("a trailing slash changes nothing", () => {
  expect(adminUrlForPath("/news/melbourne-intake-2026/")).toBe("/admin/posts?q=melbourne-intake-2026");
});

test("a page with its own admin screen maps straight to it", () => {
  expect(adminUrlForPath("/about/team")).toBe("/admin/team");
  expect(adminUrlForPath("/")).toBe("/admin/site-text");
});

test("an unknown path maps to the dashboard", () => {
  expect(adminUrlForPath("/nothing/like/this")).toBe("/admin");
  expect(adminUrlForPath("/careers")).toBe("/admin");
});

test("a preview address is never indexed", () => {
  expect(previewPath("post", "draft-article")).toBe("/preview/post/draft-article");
  expect(previewMetadata.robots).toEqual({ index: false, follow: false });
});

test("every content type has a preview address, not only articles", () => {
  expect(previewPath("event", "open-day")).toBe("/preview/event/open-day");
  expect(previewPath("course", "nursing")).toBe("/preview/course/nursing");
});

test("a name with a space in it survives the address", () => {
  expect(previewPath("testimonial", "Jane Doe")).toBe("/preview/testimonial/Jane%20Doe");
});
