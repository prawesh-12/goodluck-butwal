import { test, expect, vi } from "vitest";

vi.mock("@goodluck/db", () => ({ db: {} }));

const { buildMetadataFrom, absoluteUrl, TITLE_SUFFIX } = await import("@/lib/seo");

const defaults = {
  title: "Goodluck Education & Migration",
  description: "Education counselling and visa guidance.",
};

test("the route title wins over the default", () => {
  const meta = buildMetadataFrom({ path: "/news", title: "News and updates" }, defaults);
  expect(meta.title).toBe("News and updates");
});

test("a route with no title falls back to the settings default", () => {
  expect(buildMetadataFrom({ path: "/news" }, defaults).title).toBe(defaults.title);
});

test("a title that already ends in the site name is not templated a second time", () => {
  const meta = buildMetadataFrom({ path: "/news", title: `News${TITLE_SUFFIX}` }, defaults);
  expect(meta.title).toEqual({ absolute: `News${TITLE_SUFFIX}` });
});

test("a missing description falls back to the settings default", () => {
  const meta = buildMetadataFrom({ path: "/faq", title: "FAQ" }, defaults);
  expect(meta.description).toBe(defaults.description);
});

test("a route that asks for noindex produces a robots noindex", () => {
  const meta = buildMetadataFrom({ path: "/preview/course/nursing", noindex: true }, defaults);
  expect(meta.robots).toEqual({ index: false, follow: false });
});

test("an ordinary page carries no robots rule", () => {
  expect(buildMetadataFrom({ path: "/news" }, defaults).robots).toBeUndefined();
});

test("the canonical url is the route's own address, made absolute", () => {
  const meta = buildMetadataFrom({ path: "/news/visa-changes" }, defaults);
  expect(meta.alternates?.canonical).toBe("https://goodluck.services/news/visa-changes");
});

test("a path is made absolute", () => {
  expect(absoluteUrl("/contact")).toBe("https://goodluck.services/contact");
});

test("an address that is already absolute is left alone", () => {
  expect(absoluteUrl("https://example.com/original")).toBe("https://example.com/original");
});

test("a published date turns the open graph type into an article", () => {
  const meta = buildMetadataFrom(
    { path: "/news/visa-changes", title: "Visa changes", publishedTime: "2026-01-04" },
    defaults,
  );
  expect(meta.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-04" });
});
