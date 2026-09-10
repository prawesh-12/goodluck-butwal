import { test, expect, vi } from "vitest";

const rows = vi.hoisted(() => ({ current: [] as { key: string; value: string }[] }));

vi.mock("@db/client", () => ({
  db: { select: () => ({ from: async () => rows.current }) },
}));
vi.mock("@db/schema", () => ({ uiStrings: { key: "key", value: "value" } }));
// These tests are about which wording wins, not about caching. unstable_cache needs a Next
// request context that a unit test has no reason to build, so it passes straight through.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}));

const { loadText } = await import("@/features/site-text/queries");

test("an admin's wording wins over the one in the code", async () => {
  rows.current = [{ key: "home.hero.title", value: "Their words" }];
  const t = await loadText();
  expect(t("home.hero.title", "The default")).toBe("Their words");
});

test("a key nobody has edited falls back to the code", async () => {
  rows.current = [];
  const t = await loadText();
  expect(t("home.hero.title", "The default")).toBe("The default");
});

test("an emptied value falls back rather than showing a blank space", async () => {
  rows.current = [{ key: "home.hero.title", value: "   " }];
  const t = await loadText();
  expect(t("home.hero.title", "The default")).toBe("The default");
});

// The approved forms carry no note, so the default is blank and nothing renders until an admin
// writes one.
test("a key whose default is blank stays blank until someone writes something", async () => {
  rows.current = [];
  expect((await loadText())("forms.required_note", "")).toBe("");
  rows.current = [{ key: "forms.required_note", value: "Fields marked * are needed." }];
  expect((await loadText())("forms.required_note", "")).toBe("Fields marked * are needed.");
});
