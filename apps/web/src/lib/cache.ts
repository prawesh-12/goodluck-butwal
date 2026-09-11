import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export const TAGS = {
  uiStrings: "ui-strings",
  settings: "settings",
  offices: "offices",
  team: "team",
  partners: "partners",
  posts: "posts",
  institutions: "institutions",
  courses: "courses",
  testPrep: "test-prep",
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];

// A backstop for a revalidateTag that never arrived; a save is what normally drops the entry.
const HOUR = 3600;

// Whatever goes through here is serialised into the Next data cache, so the return value has to
// survive a JSON round trip: no Map, no Set, no Date. Rebuild those outside the cached function.
export function cached<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: Tag[],
) {
  return unstable_cache(fn, keyParts, { tags, revalidate: HOUR });
}

// Next 16 wants a cache profile on revalidateTag. `expire: 0` means "stale now", so the next
// request regenerates rather than serving the copy the admin just replaced.
export function invalidate(...tags: Tag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

export function revalidateSitemap() {
  revalidatePath("/sitemap.xml");
}
