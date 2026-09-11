import { INTAKE_MONTHS, qualificationLevels, type QualificationLevel } from "@/config/course-meta";

export const IMPORT_COLUMNS = [
  "name",
  "institution_slug",
  "qualification_level",
  "category_slug",
  "duration_months",
  "duration_label",
  "intakes",
  "tuition_fee_min",
  "tuition_fee_max",
  "tuition_currency",
] as const;

// Intake months share a cell, and a comma would need quoting in every row of the file.
export const INTAKE_SEPARATOR = "|";

export type ParsedCourse = {
  row: number;
  name: string;
  institutionSlug: string;
  qualificationLevel: QualificationLevel | null;
  categorySlug: string | null;
  durationMonths: number | null;
  durationLabel: string;
  intakes: string[];
  tuitionFeeMin: string;
  tuitionFeeMax: string;
  tuitionCurrency: string;
};

export type ImportProblem = { row: number; message: string };

export type ImportResult =
  | { ok: true; rows: ParsedCourse[] }
  | { ok: false; problems: ImportProblem[] };

export type KnownSlugs = { institutionSlugs: string[]; categorySlugs: string[] };

const MONTH_BY_LOWER = new Map(INTAKE_MONTHS.map((month) => [month.toLowerCase(), month]));
const LEVEL_BY_VALUE = new Map<string, QualificationLevel>(qualificationLevels.map((level) => [level, level]));

// Quoted fields, doubled quotes and CRLF are the whole grammar a spreadsheet export uses.
function readCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (src[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  row.push(field);
  rows.push(row);

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function checkMoney(value: string, column: string, row: number, problems: ImportProblem[]) {
  if (value === "" || /^\d+(\.\d{1,2})?$/.test(value)) return value;
  problems.push({ row, message: `Row ${row}: ${column} is "${value}", which is not a number.` });
  return "";
}

export function parseCourseCsv(text: string, known: KnownSlugs): ImportResult {
  const grid = readCsv(text);
  if (grid.length === 0) {
    return { ok: false, problems: [{ row: 0, message: "That file is empty." }] };
  }

  const header = grid[0].map((cell) => cell.trim().toLowerCase());
  if (header.length !== IMPORT_COLUMNS.length || header.some((cell, i) => cell !== IMPORT_COLUMNS[i])) {
    return {
      ok: false,
      problems: [
        {
          row: 1,
          message: `Row 1: the heading row must read exactly ${IMPORT_COLUMNS.join(",")}.`,
        },
      ],
    };
  }

  if (grid.length === 1) {
    return { ok: false, problems: [{ row: 1, message: "That file has headings but no courses." }] };
  }

  const institutions = new Set(known.institutionSlugs);
  const categories = new Set(known.categorySlugs);
  const problems: ImportProblem[] = [];
  const rows: ParsedCourse[] = [];

  for (let i = 1; i < grid.length; i += 1) {
    const row = i + 1;
    const cells = grid[i];
    if (cells.length !== IMPORT_COLUMNS.length) {
      problems.push({
        row,
        message: `Row ${row}: has ${cells.length} columns, the file needs ${IMPORT_COLUMNS.length}.`,
      });
      continue;
    }
    const [
      name,
      institutionSlug,
      level,
      categorySlug,
      durationMonths,
      durationLabel,
      intakes,
      feeMin,
      feeMax,
      currency,
    ] = cells.map((cell) => cell.trim());

    if (!name) problems.push({ row, message: `Row ${row}: name is empty.` });

    if (!institutionSlug) {
      problems.push({ row, message: `Row ${row}: institution_slug is empty.` });
    } else if (!institutions.has(institutionSlug)) {
      problems.push({
        row,
        message: `Row ${row}: no institution has the web address "${institutionSlug}".`,
      });
    }

    const parsedLevel = LEVEL_BY_VALUE.get(level) ?? null;
    if (level && !parsedLevel) {
      problems.push({
        row,
        message: `Row ${row}: qualification_level is "${level}", which is not one of ${qualificationLevels.join(", ")}.`,
      });
    }

    if (categorySlug && !categories.has(categorySlug)) {
      problems.push({
        row,
        message: `Row ${row}: no subject area has the web address "${categorySlug}".`,
      });
    }

    let months: number | null = null;
    if (durationMonths) {
      if (/^\d+$/.test(durationMonths) && Number(durationMonths) > 0) months = Number(durationMonths);
      else {
        problems.push({
          row,
          message: `Row ${row}: duration_months is "${durationMonths}", which is not a whole number of months.`,
        });
      }
    }

    const months12: string[] = [];
    for (const part of intakes.split(INTAKE_SEPARATOR).map((p) => p.trim()).filter(Boolean)) {
      const month = MONTH_BY_LOWER.get(part.toLowerCase());
      if (month) months12.push(month);
      else problems.push({ row, message: `Row ${row}: "${part}" is not a month name.` });
    }

    const min = checkMoney(feeMin, "tuition_fee_min", row, problems);
    const max = checkMoney(feeMax, "tuition_fee_max", row, problems);
    if (min && max && Number(min) > Number(max)) {
      problems.push({ row, message: `Row ${row}: tuition_fee_min is above tuition_fee_max.` });
    }

    if (currency && !/^[A-Za-z]{3}$/.test(currency)) {
      problems.push({
        row,
        message: `Row ${row}: tuition_currency is "${currency}", it needs three letters like AUD.`,
      });
    }

    rows.push({
      row,
      name,
      institutionSlug,
      qualificationLevel: parsedLevel,
      categorySlug: categorySlug || null,
      durationMonths: months,
      durationLabel,
      intakes: months12,
      tuitionFeeMin: min,
      tuitionFeeMax: max,
      tuitionCurrency: currency.toUpperCase(),
    });
  }

  // One bad row stops the whole file. A half-loaded catalogue is worse than none.
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, rows };
}
