import { test, expect, vi, beforeEach } from "vitest";

const rows = vi.hoisted(() => ({ current: [] as { from: string; to: string; status: number }[], calls: 0 }));

vi.mock("@db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async () => {
          rows.calls += 1;
          return rows.current;
        },
      }),
    }),
  },
}));

vi.mock("@db/schema", () => ({
  redirects: { fromPath: "from_path", toPath: "to_path", statusCode: "status_code", isActive: "is_active" },
}));

const { lookupRedirect, resetRedirectCache } = await import("@/lib/seo/redirects");

beforeEach(() => {
  resetRedirectCache();
  rows.calls = 0;
  rows.current = [
    { from: "/news/old-slug", to: "/news/new-slug", status: 301 },
    { from: "/services/gone", to: "/services", status: 302 },
  ];
});

test("a renamed address is found", async () => {
  expect(await lookupRedirect("/news/old-slug")).toEqual({ to: "/news/new-slug", status: 301 });
});

test("an address nobody renamed is not", async () => {
  expect(await lookupRedirect("/news/still-here")).toBe(null);
});

test("the status code stored on the row is the one used", async () => {
  expect((await lookupRedirect("/services/gone"))?.status).toBe(302);
});

test("the table is read once, not once per request", async () => {
  await lookupRedirect("/news/old-slug");
  await lookupRedirect("/news/old-slug");
  await lookupRedirect("/anything-else");
  expect(rows.calls).toBe(1);
});

test("a burst on a cold cache still makes one query", async () => {
  await Promise.all([
    lookupRedirect("/news/old-slug"),
    lookupRedirect("/news/old-slug"),
    lookupRedirect("/services/gone"),
  ]);
  expect(rows.calls).toBe(1);
});

test("a database failure returns no redirect rather than throwing", async () => {
  resetRedirectCache();
  rows.current = null as never;
  await expect(lookupRedirect("/news/old-slug")).resolves.toBe(null);
});
