import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { redirects } from "@db/schema";

type Rule = { to: string; status: number };

// Cached in the isolate: the proxy runs on every request, so reading the table each time
// would put a query in front of the whole site.
const TTL = 5 * 60 * 1000;

let cache: Map<string, Rule> | null = null;
let loadedAt = 0;
let loading: Promise<Map<string, Rule>> | null = null;

async function load() {
  const rows = await db
    .select({ from: redirects.fromPath, to: redirects.toPath, status: redirects.statusCode })
    .from(redirects)
    .where(eq(redirects.isActive, true));

  return new Map(rows.map((row) => [row.from, { to: row.to, status: row.status }]));
}

export async function lookupRedirect(path: string): Promise<Rule | null> {
  const stale = !cache || Date.now() - loadedAt > TTL;

  if (stale) {
    // One refresh at a time, so a burst of traffic on a cold isolate makes one query, not many.
    loading ??= load()
      .then((fresh) => {
        cache = fresh;
        loadedAt = Date.now();
        return fresh;
      })
      .finally(() => {
        loading = null;
      });

    // A failed refresh keeps serving the previous map rather than dropping every redirect.
    try {
      await loading;
    } catch {
      if (!cache) return null;
    }
  }

  return cache?.get(path) ?? null;
}

// Exported for the tests. Nothing else should need it.
export function resetRedirectCache() {
  cache = null;
  loadedAt = 0;
  loading = null;
}
