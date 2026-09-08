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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const clock = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
};

export type OpeningHours = { day: number; open: string; close: string; closed: boolean }[];

// Renders the one line the contact cards show, e.g. "Mon - Fri: 10 am to 5 pm".
// Returns null when the office keeps no published hours.
export function formatOpeningHours(hours: OpeningHours | null | undefined) {
  const open = hours?.filter((h) => !h.closed) ?? [];
  if (open.length === 0) return null;

  const days = open.map((h) => h.day).sort((a, b) => a - b);
  const contiguous = days.every((day, i) => i === 0 || day === days[i - 1] + 1);
  const label =
    days.length === 1
      ? DAY_NAMES[days[0]]
      : contiguous
        ? `${DAY_NAMES[days[0]]} - ${DAY_NAMES[days[days.length - 1]]}`
        : days.map((d) => DAY_NAMES[d]).join(", ");

  return `${label}: ${clock(open[0].open)} to ${clock(open[0].close)}`;
}
