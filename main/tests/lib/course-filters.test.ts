import { test, expect } from "vitest";
import {
  clearFilter,
  filterHref,
  offsetOf,
  pageCount,
  parseCourseFilters,
  PER_PAGE,
  type CourseQuery,
} from "@/components/catalogue/filters";

const known = {
  destinations: ["australia", "united-kingdom"],
  categories: ["information-technology"],
  institutions: ["deakin-university"],
};

const parse = (params: Record<string, string | string[] | undefined>) =>
  parseCourseFilters(params, known);

test("a full set of query params becomes a query", () => {
  expect(
    parse({
      destination: "australia",
      level: "bachelor",
      category: "information-technology",
      institution: "deakin-university",
      intake: "February",
      q: " nursing ",
      page: "3",
    }),
  ).toEqual({
    destination: "australia",
    level: "bachelor",
    category: "information-technology",
    institution: "deakin-university",
    intake: "February",
    q: "nursing",
    page: 3,
  });
});

test("no params is page one with no filters", () => {
  expect(parse({})).toEqual({
    destination: undefined,
    level: undefined,
    category: undefined,
    institution: undefined,
    intake: undefined,
    q: undefined,
    page: 1,
  });
});

test("an unknown filter value is ignored, not an error", () => {
  const q = parse({ destination: "atlantis", category: "wizardry", institution: "hogwarts" });
  expect(q.destination).toBeUndefined();
  expect(q.category).toBeUndefined();
  expect(q.institution).toBeUndefined();
});

test("an unknown level or intake is ignored", () => {
  const q = parse({ level: "phd", intake: "Smarch" });
  expect(q.level).toBeUndefined();
  expect(q.intake).toBeUndefined();
});

test("a repeated param uses the first value", () => {
  expect(parse({ destination: ["australia", "united-kingdom"] }).destination).toBe("australia");
});

test("a junk page number falls back to page one", () => {
  expect(parse({ page: "nonsense" }).page).toBe(1);
  expect(parse({ page: "0" }).page).toBe(1);
  expect(parse({ page: "-4" }).page).toBe(1);
});

test("an empty keyword is dropped and a long one is capped", () => {
  expect(parse({ q: "   " }).q).toBeUndefined();
  expect(parse({ q: "x".repeat(200) }).q).toHaveLength(80);
});

test("paging maths gives the right offset", () => {
  expect(offsetOf(1)).toBe(0);
  expect(offsetOf(2)).toBe(PER_PAGE);
  expect(offsetOf(3)).toBe(PER_PAGE * 2);
});

test("paging maths gives the right total pages", () => {
  expect(pageCount(0)).toBe(1);
  expect(pageCount(1)).toBe(1);
  expect(pageCount(PER_PAGE)).toBe(1);
  expect(pageCount(PER_PAGE + 1)).toBe(2);
  expect(pageCount(45)).toBe(3);
});

test("a link carries every filter and omits page one", () => {
  const q: CourseQuery = { destination: "australia", level: "master", q: "data", page: 1 };
  expect(filterHref(q)).toBe("/courses?destination=australia&level=master&q=data");
});

test("changing the page keeps the filters", () => {
  const q: CourseQuery = { destination: "australia", page: 1 };
  expect(filterHref(q, { page: 4 })).toBe("/courses?destination=australia&page=4");
});

test("changing a filter resets to page one", () => {
  const q: CourseQuery = { destination: "australia", page: 5 };
  expect(filterHref(q, { destination: "united-kingdom" })).toBe("/courses?destination=united-kingdom");
});

test("clearing one filter leaves the others intact", () => {
  const q: CourseQuery = {
    destination: "australia",
    level: "bachelor",
    category: "information-technology",
    page: 3,
  };
  const cleared = clearFilter(q, "level");
  expect(cleared).toEqual({
    destination: "australia",
    category: "information-technology",
    page: 1,
  });
  expect(filterHref(cleared)).toBe("/courses?destination=australia&category=information-technology");
});

test("clearing the last filter goes back to the plain page", () => {
  expect(filterHref(clearFilter({ q: "nursing", page: 2 }, "q"))).toBe("/courses");
});
