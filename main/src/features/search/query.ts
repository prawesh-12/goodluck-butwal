// Search state lives in the URL so a result page can be shared and the back button works.

import type { Article } from "@/components/shared/inner";

export const KINDS = [
  "courses",
  "institutions",
  "posts",
  "destinations",
  "services",
  "events",
] as const;

export type SearchKind = (typeof KINDS)[number];

const kindLabels: Record<SearchKind, string> = {
  courses: "Courses",
  institutions: "Institutions",
  posts: "News",
  destinations: "Study destinations",
  services: "Services",
  events: "Events",
};

export const MAX_QUERY = 100;

export type SearchHit = { kind: SearchKind; href: string; article: Article };
export type SearchGroup = { kind: SearchKind; label: string; count: number; hits: SearchHit[] };

// ILIKE reads % and _ as wildcards, and the escaping backslash has to be escaped first.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export function searchTerm(raw: string | string[] | null | undefined) {
  const value = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const q = value.trim().slice(0, MAX_QUERY);
  if (!q) return null;
  return { q, pattern: `%${escapeLike(q)}%` };
}

export function groupHits(hits: SearchHit[]): SearchGroup[] {
  return KINDS.map((kind) => {
    const found = hits.filter((hit) => hit.kind === kind);
    return { kind, label: kindLabels[kind], count: found.length, hits: found };
  }).filter((group) => group.count > 0);
}
