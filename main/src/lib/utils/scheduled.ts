export type ScheduledRow = {
  status: "draft" | "scheduled" | "published" | "archived";
  publishedAt: Date | null;
};

export function isDueToPublish(row: ScheduledRow, now: Date): boolean {
  if (row.status !== "scheduled") return false;
  return Boolean(row.publishedAt) && row.publishedAt!.getTime() <= now.getTime();
}
