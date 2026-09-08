import { test, expect } from "vitest";
import {
  costItem,
  destinationBlocks,
  destinationPublishProblems,
  intakeItem,
} from "@/lib/validators/destination";

const blocks = {
  highlights: [{ label: "Institutions", value: "1,100+", note: "" }],
  why: [{ text: "Work rights while studying." }],
  checklist: [{ text: "Passport" }],
  intakes: [{ month: "February", note: "Main intake" }],
  migration: [{ title: "Post study work", body: "Two to four years.", icon: "" }],
  costs: [{ label: "Tuition", amount: 30000, currency: "AUD", note: "A year" }],
  help: [{ title: "Applications", body: "We file them for you." }],
};

test("the seven destination blocks survive a round trip through their schema", () => {
  expect(destinationBlocks.parse(blocks)).toEqual(blocks);
});

test("an intake with no month is refused", () => {
  expect(intakeItem.safeParse({ month: "", note: "" }).success).toBe(false);
});

test("a cost in a currency that is not three letters is refused", () => {
  expect(costItem.safeParse({ label: "Tuition", amount: 1, currency: "dollars", note: "" }).success).toBe(false);
});

const published = {
  name: "Australia",
  hasPage: true,
  overviewHtml: "<p>A good place to study.</p>",
  heroImageId: "hero",
  cardImageId: "card",
  flagImageId: "flag",
  highlights: blocks.highlights,
  why: blocks.why,
  migration: blocks.migration,
  help: blocks.help,
  checklist: blocks.checklist,
  whyTitle: "Why Australia",
  migrationTitle: "After you graduate",
  checklistTitle: "What you need",
};

test("a complete destination has nothing blocking it", () => {
  expect(destinationPublishProblems(published)).toEqual([]);
});

test("publishing names every missing destination field", () => {
  const problems = destinationPublishProblems({
    ...published,
    overviewHtml: "",
    heroImageId: null,
    highlights: [],
    whyTitle: "",
  });
  expect(problems).toEqual([
    "There is no hero image.",
    "The overview is empty.",
    "There are no highlights.",
    "The reasons list has no heading.",
  ]);
});

test("a destination with no page of its own only needs a name and a card", () => {
  expect(
    destinationPublishProblems({
      ...published,
      name: "New Zealand",
      hasPage: false,
      overviewHtml: "",
      heroImageId: null,
      flagImageId: null,
      highlights: [],
      why: [],
      migration: [],
      help: [],
    }),
  ).toEqual([]);
});

test("a destination card with no image cannot be published", () => {
  expect(destinationPublishProblems({ ...published, hasPage: false, cardImageId: null })).toEqual([
    "There is no card image for the homepage.",
  ]);
});
