export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

// Timestamps are stored UTC and only mean anything next to an office, so the zone is named.
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

// A form sends HH:MM, the same column read back from Postgres is HH:MM:SS. Appending seconds
// to a value that already had them produced an invalid date.
export function officeSlot(date?: string | null, time?: string | null): Date | null {
  if (!date || !time) return null;
  const [hour, minute] = time.split(":");
  if (hour === undefined || minute === undefined) return null;
  const at = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00Z`);
  return Number.isNaN(at.getTime()) ? null : at;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const clock = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
};

export type OpeningHours = { day: number; open: string; close: string; closed: boolean }[];

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
