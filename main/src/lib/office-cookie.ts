import type { OfficeId } from "@/lib/site";

export const OFFICE_COOKIE = "gem_office";

export function readOfficeCookie(cookies: string): string | null {
  return cookies.match(new RegExp(`(?:^|;\\s*)${OFFICE_COOKIE}=([^;]*)`))?.[1] ?? null;
}

// Browsers report "Asia/Kathmandu" or the older "Asia/Katmandu".
export const officeFromTimezone = (timezone: string): OfficeId =>
  /Asia\/Kat(h)?mandu/.test(timezone) ? "np" : "au";

// A cookie only counts when it names an office the site actually publishes, otherwise anyone
// could park an unknown value in it and decide what the header shows.
export function resolveOffice(
  cookie: string | null | undefined,
  timezone: string,
  known: readonly string[],
): OfficeId {
  if (cookie && known.includes(cookie)) return cookie as OfficeId;
  return officeFromTimezone(timezone);
}
