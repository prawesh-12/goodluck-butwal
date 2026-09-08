import { expect, test } from "vitest";
import { previewMetadata, previewPath } from "@/lib/preview";

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
