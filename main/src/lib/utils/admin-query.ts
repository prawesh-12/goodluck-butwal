import { and, type SQL } from "drizzle-orm";
import { contentStatuses } from "@/lib/validators/fields";

// Every admin list is paged the same way and filtered the same way, so the plumbing lives here
// rather than being repeated once per area.
export const PAGE_SIZE = 25;

export type AdminFilters = { q?: string; status?: string; office?: string; page?: number };

export type ContentFilters = {
  q?: string;
  status?: string;
  parent?: string;
  scope?: string;
  page?: number;
};

export type CatalogueFilters = {
  q?: string;
  status?: string;
  destination?: string;
  institution?: string;
  category?: string;
  level?: string;
  page?: number;
};

export type EditorialFilters = {
  q?: string;
  status?: string;
  office?: string;
  category?: string;
  type?: string;
  page?: number;
};

type Status = (typeof contentStatuses)[number];

export const asStatus = (value?: string) =>
  contentStatuses.includes(value as Status) ? (value as Status) : undefined;

export function combine(parts: (SQL | undefined)[]) {
  const defined = parts.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

export const pageOf = (f: { page?: number }) => Math.max(1, f.page ?? 1);
