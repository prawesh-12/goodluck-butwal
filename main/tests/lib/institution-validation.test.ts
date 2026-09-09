import { test, expect } from "vitest";
import {
  institutionPublishProblems,
  matchPartnersToInstitutions,
  normaliseName,
} from "@/features/institutions/validators";

const ready = {
  name: "[PLACEHOLDER] Institution 1",
  country: "Australia",
  descriptionHtml: "<p>A description.</p>",
  logoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
};

test("a complete institution has nothing to fix", () => {
  expect(institutionPublishProblems(ready)).toEqual([]);
});

test("publish validation names every missing field at once", () => {
  const problems = institutionPublishProblems({
    name: "",
    country: "  ",
    descriptionHtml: "",
    logoId: null,
  });
  expect(problems).toHaveLength(4);
  expect(problems.join(" ")).toContain("Name");
  expect(problems.join(" ")).toContain("Country");
  expect(problems.join(" ")).toContain("description");
  expect(problems.join(" ")).toContain("logo");
});

test("an image with no alt text blocks publishing and is named", () => {
  const problems = institutionPublishProblems(ready, [
    { label: "The logo", id: ready.logoId, altText: null },
  ]);
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain("The logo");
  expect(problems[0]).toContain("alt text");
});

test("a described image does not block publishing", () => {
  const problems = institutionPublishProblems(ready, [
    { label: "The logo", id: ready.logoId, altText: "The crest" },
  ]);
  expect(problems).toEqual([]);
});

test("an image nobody attached is not checked for alt text", () => {
  expect(institutionPublishProblems(ready, [{ label: "Share image", id: null, altText: null }])).toEqual([]);
});

test("names are matched ignoring case and extra spacing", () => {
  expect(normaliseName("  Deakin   University ")).toBe("deakin university");
});

test("partners are linked to the institution with the same name", () => {
  const pairs = matchPartnersToInstitutions(
    [{ id: "p1", name: "Deakin University", institutionId: null }],
    [{ id: "i1", name: "deakin university" }],
  );
  expect(pairs).toEqual([{ partnerId: "p1", institutionId: "i1" }]);
});

test("linking is a no-op when no partner name matches an institution", () => {
  const pairs = matchPartnersToInstitutions(
    [
      { id: "p1", name: "Partner 1", institutionId: null },
      { id: "p2", name: "Partner 2", institutionId: null },
    ],
    [{ id: "i1", name: "[PLACEHOLDER] Institution 1" }],
  );
  expect(pairs).toEqual([]);
});

test("a partner already pointing at the right institution is left alone", () => {
  const pairs = matchPartnersToInstitutions(
    [{ id: "p1", name: "Deakin University", institutionId: "i1" }],
    [{ id: "i1", name: "Deakin University" }],
  );
  expect(pairs).toEqual([]);
});
