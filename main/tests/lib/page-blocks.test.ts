import { test, expect } from "vitest";
import {
  blocksSchemaFor,
  missingAltProblems,
  pagePath,
  pagePublishProblems,
  slugRedirect,
} from "@/lib/validators/page";

const about = {
  established: "Founded in 2015.",
  mission: "Help students.",
  vision: "Be trusted.",
  values: [{ title: "Honesty", body: "We say what is true." }],
  ethics: ["No false promises."],
  quote: { text: "We started small.", author: "The founders" },
};

test("the about blocks survive a round trip through their schema", () => {
  expect(blocksSchemaFor("about").parse(about)).toEqual(about);
});

test("a legal page keeps no blocks", () => {
  expect(blocksSchemaFor("privacy-policy").parse({})).toEqual({});
});

test("a careers voice without a name is refused", () => {
  const result = blocksSchemaFor("careers").safeParse({
    values: [],
    voices: [{ quote: "Good place to work.", name: "", role: "Counsellor", photo_id: null }],
    apply_email: null,
  });
  expect(result.success).toBe(false);
});

test("a co-founders photo that is not a media id is refused", () => {
  const result = blocksSchemaFor("message-from-co-founders").safeParse({
    message_html: "<p>Hello.</p>",
    summary: "Hello.",
    photo_id: "/images/team/co-founders.webp",
  });
  expect(result.success).toBe(false);
});

test("publishing names every missing about field", () => {
  const problems = pagePublishProblems({
    slug: "about",
    title: "",
    bodyHtml: "",
    blocks: { ...about, established: "", mission: "", ethics: [] },
  });
  expect(problems).toEqual([
    "Title is empty.",
    "The established line is empty.",
    "Mission is empty.",
    "There are no ethics bullets.",
  ]);
});

test("a legal page cannot be published with an empty body", () => {
  const problems = pagePublishProblems({ slug: "terms", title: "Terms", bodyHtml: " ", blocks: {} });
  expect(problems).toEqual(["The page body is empty."]);
});

test("an image nobody has described blocks publishing", () => {
  const problems = missingAltProblems([
    { label: "The hero image", id: "a", altText: null },
    { label: "The card image", id: "b", altText: "A campus lawn" },
    { label: "A decorative swirl", id: "c", altText: "" },
    { label: "The share image", id: null, altText: null },
  ]);
  expect(problems).toEqual(["The hero image has no alt text. Describe it in Media first."]);
});

test("the about page sits at /about and its children under it", () => {
  expect(pagePath("about", "about")).toBe("/about");
  expect(pagePath("about", "careers")).toBe("/about/careers");
  expect(pagePath("legal", "privacy-policy")).toBe("/legal/privacy-policy");
});

test("renaming a published address writes a 301", () => {
  expect(slugRedirect("/services/visa-guidance", "/services/visa-help", true)).toEqual({
    fromPath: "/services/visa-guidance",
    toPath: "/services/visa-help",
    statusCode: 301,
    isActive: true,
    note: "Address changed from /services/visa-guidance to /services/visa-help",
  });
});

test("a draft rename writes no redirect", () => {
  expect(slugRedirect("/services/a", "/services/b", false)).toBe(null);
});

test("saving without changing the address writes no redirect", () => {
  expect(slugRedirect("/services/a", "/services/a", true)).toBe(null);
});
