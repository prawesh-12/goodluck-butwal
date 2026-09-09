// Filter state lives in the URL so a course search can be shared and the back button works.
// Pure: no database, no React, so it can be unit tested on its own.

export const PER_PAGE = 20;

export const LEVELS = [
  { value: "foundation", label: "Foundation" },
  { value: "english_language", label: "English language" },
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "advanced_diploma", label: "Advanced diploma" },
  { value: "bachelor", label: "Bachelor" },
  { value: "graduate_certificate", label: "Graduate certificate" },
  { value: "graduate_diploma", label: "Graduate diploma" },
  { value: "master", label: "Master" },
  { value: "doctorate", label: "Doctorate" },
] as const;

export type Level = (typeof LEVELS)[number]["value"];

export const INTAKES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type Intake = (typeof INTAKES)[number];

export type CourseQuery = {
  destination?: string;
  level?: Level;
  category?: string;
  institution?: string;
  intake?: Intake;
  q?: string;
  page: number;
};

export type KnownFilters = {
  destinations: string[];
  categories: string[];
  institutions: string[];
};

export type SearchParams = Record<string, string | string[] | undefined>;

const KEYS = ["destination", "level", "category", "institution", "intake", "q"] as const;

export type FilterKey = (typeof KEYS)[number];

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

const known = <T extends string>(value: string | string[] | undefined, allowed: readonly T[]) => {
  const v = first(value);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
};

// Anything that is not a slug we already hold is dropped, so a hand-edited URL renders a page
// rather than an error.
export function parseCourseFilters(params: SearchParams, options: KnownFilters): CourseQuery {
  const page = Number.parseInt(first(params.page) ?? "", 10);
  const keyword = first(params.q);
  return {
    destination: known(params.destination, options.destinations),
    level: known(
      params.level,
      LEVELS.map((l) => l.value),
    ),
    category: known(params.category, options.categories),
    institution: known(params.institution, options.institutions),
    intake: known(params.intake, INTAKES),
    q: keyword ? keyword.slice(0, 80) : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function pageCount(total: number, perPage = PER_PAGE) {
  return Math.max(1, Math.ceil(total / perPage));
}

export function offsetOf(page: number, perPage = PER_PAGE) {
  return (Math.max(1, page) - 1) * perPage;
}

export function activeFilters(query: CourseQuery) {
  return KEYS.filter((key) => query[key]).map((key) => ({ key, value: query[key] as string }));
}

export function clearFilter(query: CourseQuery, key: FilterKey): CourseQuery {
  const next = { ...query, page: 1 };
  delete next[key];
  return next;
}

// Any change resets to page one unless the change is the page itself.
export function filterHref(query: CourseQuery, change: Partial<CourseQuery> = {}, path = "/courses") {
  const next = { ...query, page: 1, ...change };
  const params = new URLSearchParams();
  for (const key of KEYS) {
    const value = next[key];
    if (value) params.set(key, value);
  }
  if (next.page > 1) params.set("page", String(next.page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
