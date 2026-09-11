const OFFICE_TZ = "Australia/Melbourne";

// A preferred date is a calendar day with no zone attached, so it is read back as UTC. Read in
// the server's zone it would slide to the day before whenever that zone sits behind UTC.
export function dateLabel(day: string | null) {
  if (!day) return "Not set";
  const at = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(at.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(at);
}

export function timeLabel(time: string | null) {
  if (!time) return "Not set";
  const at = new Date(`1970-01-01T${time}Z`);
  if (Number.isNaN(at.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(at);
}

// Timestamps are stored UTC and only make sense next to the offices that read them.
export function submittedLabel(at: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: OFFICE_TZ,
  }).format(at);
}
