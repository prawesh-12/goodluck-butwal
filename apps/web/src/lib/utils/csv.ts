// Excel mangles every accented name in a UTF-8 CSV without a byte order mark.
const BOM = "﻿";

function cell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  // A leading =, +, - or @ makes Excel treat the cell as a formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]) {
  if (rows.length === 0) return BOM;
  const keys = columns ?? Object.keys(rows[0]);
  const lines = [keys.join(","), ...rows.map((row) => keys.map((key) => cell(row[key])).join(","))];
  return BOM + lines.join("\r\n");
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
