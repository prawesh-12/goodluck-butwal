import type { OfficeId } from "@/config/site";

const OFFICE_COOKIE = "gem_office";
export const OFFICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readOfficeCookie(cookies: string): string | null {
  return cookies.match(new RegExp(`(?:^|;\\s*)${OFFICE_COOKIE}=([^;]*)`))?.[1] ?? null;
}

export const officeCookie = (office: OfficeId) =>
  `${OFFICE_COOKIE}=${office}; path=/; max-age=${OFFICE_COOKIE_MAX_AGE}; samesite=lax`;

// Browsers report "Asia/Kathmandu" or the older "Asia/Katmandu".
const officeFromTimezone = (timezone: string): OfficeId =>
  /Asia\/Kat(h)?mandu/.test(timezone) ? "np" : "au";

// Only a published office counts, otherwise anyone could park a value here and decide what
// the header shows.
export function resolveOffice(
  cookie: string | null | undefined,
  timezone: string,
  known: readonly string[],
): OfficeId {
  if (cookie && known.includes(cookie)) return cookie as OfficeId;
  return officeFromTimezone(timezone);
}
