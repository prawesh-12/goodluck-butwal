import { test, expect } from "vitest";
import { IMPORT_COLUMNS, parseCourseCsv } from "@/features/courses/import";

const known = {
  institutionSlugs: ["placeholder-institution-1", "placeholder-institution-2"],
  categorySlugs: ["business-and-management", "engineering"],
};

const header = IMPORT_COLUMNS.join(",");

function file(...rows: string[]) {
  return [header, ...rows].join("\n");
}

const clean =
  "Bachelor of Business,placeholder-institution-1,bachelor,business-and-management,36,3 years,February|July,24000,28000,AUD";

test("a clean file parses to the right rows", () => {
  const result = parseCourseCsv(file(clean), known);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0]).toMatchObject({
    row: 2,
    name: "Bachelor of Business",
    institutionSlug: "placeholder-institution-1",
    qualificationLevel: "bachelor",
    categorySlug: "business-and-management",
    durationMonths: 36,
    durationLabel: "3 years",
    intakes: ["February", "July"],
    tuitionFeeMin: "24000",
    tuitionFeeMax: "28000",
    tuitionCurrency: "AUD",
  });
});

test("one bad qualification level fails the whole import and names the row", () => {
  const bad =
    "Diploma of IT,placeholder-institution-2,bachelors,engineering,12,1 year,March,,,";
  const result = parseCourseCsv(file(clean, bad), known);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.problems).toHaveLength(1);
  expect(result.problems[0].row).toBe(3);
  expect(result.problems[0].message).toContain("Row 3");
  expect(result.problems[0].message).toContain("qualification_level");
  expect(result.problems[0].message).toContain("bachelors");
});

test("a missing institution_slug is named", () => {
  const result = parseCourseCsv(
    file("Bachelor of Nursing,,bachelor,engineering,36,3 years,February,,,"),
    known,
  );
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.problems[0].message).toBe("Row 2: institution_slug is empty.");
});

test("an institution_slug that matches nothing is named", () => {
  const result = parseCourseCsv(
    file("Bachelor of Nursing,no-such-school,bachelor,engineering,36,3 years,February,,,"),
    known,
  );
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.problems[0].message).toContain("no-such-school");
});

test("intakes split on the separator and unknown months are named", () => {
  const ok = parseCourseCsv(
    file("Course A,placeholder-institution-1,master,engineering,18,,February|July|november,,,"),
    known,
  );
  expect(ok.ok).toBe(true);
  if (ok.ok) expect(ok.rows[0].intakes).toEqual(["February", "July", "November"]);

  const bad = parseCourseCsv(
    file("Course A,placeholder-institution-1,master,engineering,18,,Febtober,,,"),
    known,
  );
  expect(bad.ok).toBe(false);
  if (!bad.ok) expect(bad.problems[0].message).toContain("Febtober");
});

test("a fee that is not a number is refused", () => {
  const result = parseCourseCsv(
    file("Course A,placeholder-institution-1,master,engineering,18,,February,twenty grand,,AUD"),
    known,
  );
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.problems[0].message).toContain("tuition_fee_min");
  expect(result.problems[0].message).toContain("not a number");
});

test("an empty file is refused", () => {
  expect(parseCourseCsv("", known)).toEqual({
    ok: false,
    problems: [{ row: 0, message: "That file is empty." }],
  });
});

test("a file with headings but no courses is refused", () => {
  const result = parseCourseCsv(header, known);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.problems[0].message).toContain("no courses");
});

test("the wrong heading row is refused before any row is read", () => {
  const result = parseCourseCsv("name,institution\nA,b", known);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.problems[0].message).toContain("Row 1");
});

test("a quoted comma stays inside its own cell", () => {
  const result = parseCourseCsv(
    file('"Bachelor of Arts, Honours",placeholder-institution-1,bachelor,engineering,36,,February,,,'),
    known,
  );
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.rows[0].name).toBe("Bachelor of Arts, Honours");
});

test("every failing row is listed, not just the first", () => {
  const result = parseCourseCsv(
    file(
      "Course A,nowhere,bachelor,engineering,12,,February,,,",
      "Course B,placeholder-institution-1,wrong,engineering,12,,February,,,",
    ),
    known,
  );
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.problems.map((p) => p.row)).toEqual([2, 3]);
});
