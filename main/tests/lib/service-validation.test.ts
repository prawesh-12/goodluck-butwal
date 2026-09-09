import { test, expect } from "vitest";
import { createServiceSchema, faqListSchema, servicePublishProblems } from "@/features/services/validators";

const service = {
  slug: "visa-guidance",
  name: "Visa guidance",
  category: "migration",
  officeScope: "both",
  summary: "We prepare and lodge the application.",
  introHtml: "<p>What we do.</p>",
  steps: [{ title: "Assessment", body: "We check your eligibility." }],
  facts: [{ label: "Applications lodged", value: "2,400" }],
  documents: [{ label: "Passport" }],
  artworkId: "8a1a1b3e-6a4a-4a8b-8f0e-1f2a3b4c5d6e",
  reelId: null,
  posterImageId: null,
  tone: "dark",
  isFeatured: true,
  status: "published",
  sortOrder: 1,
  label: "Visa",
  stepsTitle: "How it works",
  listTitle: "What to bring",
  seoTitle: "",
  seoDescription: "",
  seoOgImageId: null,
  seoNoindex: false,
  canonicalUrl: "",
};

test("a service saves with one of the four card colours", () => {
  expect(createServiceSchema.parse(service).tone).toBe("dark");
});

test("a card colour outside the four is refused", () => {
  const result = createServiceSchema.safeParse({ ...service, tone: "green" });
  expect(result.success).toBe(false);
});

test("an address with spaces in it is refused", () => {
  const result = createServiceSchema.safeParse({ ...service, slug: "visa guidance" });
  expect(result.success).toBe(false);
});

test("publishing names every missing service field", () => {
  const problems = servicePublishProblems({
    name: "Visa guidance",
    summary: "",
    introHtml: "",
    artworkId: null,
    steps: [],
    documents: [{ label: "Passport" }],
    label: "",
    stepsTitle: "",
    listTitle: "",
  });
  expect(problems).toEqual([
    "The one-line summary is empty.",
    "The introduction is empty.",
    "There is no artwork for the homepage card.",
    "The homepage card badge is empty.",
    "There are no steps.",
    "The documents list has no heading.",
  ]);
});

test("a complete service has nothing blocking it", () => {
  expect(servicePublishProblems(service)).toEqual([]);
});

test("a question with no answer is refused", () => {
  const result = faqListSchema.safeParse({
    ownerId: "8a1a1b3e-6a4a-4a8b-8f0e-1f2a3b4c5d6e",
    items: [{ question: "How long does it take?", answerHtml: "" }],
  });
  expect(result.success).toBe(false);
});

test("questions keep the order they were sent in", () => {
  const parsed = faqListSchema.parse({
    ownerId: "8a1a1b3e-6a4a-4a8b-8f0e-1f2a3b4c5d6e",
    items: [
      { question: "Second", answerHtml: "b" },
      { question: "First", answerHtml: "a" },
    ],
  });
  expect(parsed.items.map((item) => item.question)).toEqual(["Second", "First"]);
});
