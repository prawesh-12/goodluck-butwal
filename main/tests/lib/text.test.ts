import { test, expect, vi } from "vitest";

const rows = vi.hoisted(() => ({ current: [] as { key: string; value: string }[] }));

vi.mock("@db/client", () => ({
  db: { select: () => ({ from: async () => rows.current }) },
}));
vi.mock("@db/schema", () => ({ uiStrings: { key: "key", value: "value" } }));

const { loadText } = await import("@/server/queries/text");

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
