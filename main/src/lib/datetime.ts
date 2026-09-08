export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

// Every timestamp is stored UTC. Times only mean anything next to the office they belong to,
// so the zone abbreviation is always shown.
export function formatInOfficeTz(
  value: Date | string,
  timeZone: string,
  // Spelled out rather than dateStyle/timeStyle, which Intl refuses to mix with timeZoneName.
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-AU", {
    ...options,
    timeZone,
    timeZoneName: "short",
  }).format(date);
}
