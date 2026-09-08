import type { Metadata } from "next";

const LISTS: Record<string, string> = {
  news: "posts",
  courses: "courses",
  events: "events",
  institutions: "institutions",
  services: "services",
  "study-abroad": "destinations",
  "test-preparation": "test-prep",
  legal: "pages",
};

const EXACT: Record<string, string> = {
  "/": "/admin/site-text",
  "/about/team": "/admin/team",
  "/success-stories": "/admin/testimonials",
  "/contact": "/admin/offices",
  "/contact/book-consultation": "/admin/consultations",
  "/test-preparation/batches": "/admin/test-prep/batches",
};

// Admin editors are addressed by id and a public page only knows its slug, so a record lands on
// its list filtered by that slug rather than needing a lookup on every public page render.
export function adminUrlForPath(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (EXACT[path]) return EXACT[path];

  const [section, ...rest] = path.split("/").filter(Boolean);
  const list = LISTS[section];
  if (!list) return "/admin";
  return rest.length === 1 ? `/admin/${list}?q=${encodeURIComponent(rest[0])}` : `/admin/${list}`;
}

export function previewPath(kind: string, slug: string) {
  return kind === "post" ? `/preview/post/${slug}` : `/preview/${kind}/${encodeURIComponent(slug)}`;
}


export const previewMetadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};
