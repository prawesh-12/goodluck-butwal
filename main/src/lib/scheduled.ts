export type ScheduledRow = {
  status: "draft" | "scheduled" | "published" | "archived";
  publishedAt: Date | null;
  // Only testimonials carry consent. Undefined means the table has no consent rule.
  consentGiven?: boolean;
};

export function isDueToPublish(row: ScheduledRow, now: Date): boolean {
  if (row.status !== "scheduled") return false;
  if (!row.publishedAt || row.publishedAt.getTime() > now.getTime()) return false;
  return row.consentGiven !== false;
}
