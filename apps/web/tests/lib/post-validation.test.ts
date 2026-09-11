import { test, expect } from "vitest";
import {
  bodyImagesMissingAlt,
  createPostSchema,
  postPublishProblems,
  readingMinutes,
  type PostInput,
} from "@/features/posts/validators";

const ready: PostInput = {
  title: "Studying in Australia",
  slug: "studying-in-australia",
  excerpt: "What the student visa asks for.",
  bodyHtml: "<p>Words.</p>",
  bannerImageId: "11111111-1111-4111-8111-111111111111",
  categoryId: "22222222-2222-4222-8222-222222222222",
  officeId: "",
  destinationId: "",
  tagIds: [],
  authorDisplayName: "",
  status: "published",
};

test("reading time rounds a word count to whole minutes", () => {
  expect(readingMinutes("<p>" + "word ".repeat(400) + "</p>")).toBe(2);
});

test("a very short post still reads as one minute", () => {
  expect(readingMinutes("<p>Three words here</p>")).toBe(1);
});

test("markup is not counted as words", () => {
  expect(readingMinutes("<p><strong>one</strong> two</p>")).toBe(readingMinutes("one two"));
});

test("a post with everything in place has nothing blocking publication", () => {
  expect(postPublishProblems(ready, { banner: "Students on campus" })).toEqual([]);
});

test("publish validation names every missing field", () => {
  const problems = postPublishProblems(
    { ...ready, excerpt: "", bodyHtml: "", categoryId: "", bannerImageId: "" },
    {},
  );
  expect(problems).toEqual(["Summary", "Body", "Category", "Image"]);
});

test("publishing is blocked while the banner image has no alt text", () => {
  expect(postPublishProblems(ready, { banner: null })).toEqual(["A description for the image"]);
});

test("an image in the body without alt text is named", () => {
  const problems = postPublishProblems(
    { ...ready, bodyHtml: '<p>Text</p><img src="/images/news/fair.jpg">' },
    { banner: "Students on campus" },
  );
  expect(problems).toEqual(["A description for fair.jpg in the body"]);
});

test("an image in the body with alt text passes", () => {
  expect(bodyImagesMissingAlt('<img src="/a/b.jpg" alt="A queue at the fair">')).toEqual([]);
});

test("a post cannot be saved as scheduled", () => {
  expect(createPostSchema.safeParse({ ...ready, status: "scheduled" }).success).toBe(false);
});

test("a go-live date cannot be submitted any more", () => {
  const parsed = createPostSchema.parse({ ...ready, publishedAt: "2030-01-01T09:00" });
  expect(Object.keys(parsed)).not.toContain("publishedAt");
});

test("a draft needs no date at all", () => {
  expect(createPostSchema.safeParse({ ...ready, status: "draft" }).success).toBe(true);
});

test("an excerpt longer than the counter allows is refused", () => {
  const result = createPostSchema.safeParse({ ...ready, excerpt: "x".repeat(201) });
  expect(result.success).toBe(false);
});
