import { expect, test } from "vitest";
import { previewMetadata, previewPath } from "@/lib/security/preview";

test("a preview address is never indexed", () => {
  expect(previewPath("post", "draft-article")).toBe("/preview/post/draft-article");
  expect(previewMetadata.robots).toEqual({ index: false, follow: false });
});

test("every content type has a preview address, not only articles", () => {
  expect(previewPath("event", "open-day")).toBe("/preview/event/open-day");
  expect(previewPath("course", "nursing")).toBe("/preview/course/nursing");
});

