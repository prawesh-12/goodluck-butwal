const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function scheduleDays(days: number[] | null) {
  if (!days || days.length === 0) return "Not set";
  return [...days].sort((a, b) => a - b).map((d) => DAY_SHORT[d] ?? "?").join(", ");
}

const clock = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
};

// The zone the office keeps, named the way Intl names it, e.g. AEST or GMT+5:45.
export function zoneName(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone, timeZoneName: "short" }).formatToParts(new Date());
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

// start_time and end_time are already office-local, so nothing is converted. The zone is named
// so a reader in another country knows which clock the class runs on.
export function classTime(start: string | null, end: string | null, timeZone: string) {
  if (!start) return "Not set";
  const range = end ? `${clock(start)} to ${clock(end)}` : clock(start);
  return `${range} ${zoneName(timeZone)}`.trim();
}

export const MODE_LABEL: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "Hybrid",
};

export const TEST_LABEL: Record<string, string> = { ielts: "IELTS", pte: "PTE" };
