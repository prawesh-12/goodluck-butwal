import { test, expect, vi } from "vitest";

vi.mock("@db/client", () => ({ db: {} }));

const { buildMetadataFrom, absoluteUrl, TITLE_SUFFIX } = await import("@/lib/seo");

const defaults = {
  title: "Goodluck Education & Migration",
  description: "Education counselling and visa guidance.",
  ogImage: "https://res.cloudinary.com/demo/image/upload/default.jpg",
};

const row = {
  seoTitle: null,
  seoDescription: null,
  seoNoindex: false,
  canonicalUrl: null,
  ogImage: null,
};

test("the row's own title wins over the route title and the default", () => {
  const meta = buildMetadataFrom(
    { path: "/news/visa-changes", title: "Visa changes", row: { ...row, seoTitle: "Visa changes 2026" } },
    defaults,
  );
  expect(meta.title).toBe("Visa changes 2026");
});

test("a row with no title falls back to the settings default", () => {
  const meta = buildMetadataFrom({ path: "/news", row }, defaults);
  expect(meta.title).toBe(defaults.title);
});

test("the route title is used when the row has none", () => {
  const meta = buildMetadataFrom({ path: "/news", title: "News and updates", row }, defaults);
  expect(meta.title).toBe("News and updates");
});

test("a title that already ends in the site name is not templated a second time", () => {
  const meta = buildMetadataFrom(
    { path: "/news", row: { ...row, seoTitle: `News${TITLE_SUFFIX}` } },
    defaults,
  );
  expect(meta.title).toEqual({ absolute: `News${TITLE_SUFFIX}` });
});

test("a missing description falls back to the settings default", () => {
  const meta = buildMetadataFrom({ path: "/faq", title: "FAQ", row }, defaults);
  expect(meta.description).toBe(defaults.description);
});

test("seo_noindex produces a robots noindex", () => {
  const meta = buildMetadataFrom({ path: "/news", row: { ...row, seoNoindex: true } }, defaults);
  expect(meta.robots).toEqual({ index: false, follow: false });
});

test("a page without noindex carries no robots rule", () => {
  expect(buildMetadataFrom({ path: "/news", row }, defaults).robots).toBeUndefined();
});

test("the canonical url is absolute", () => {
  const meta = buildMetadataFrom({ path: "/news/visa-changes", row }, defaults);
  expect(meta.alternates?.canonical).toBe("https://goodluck.services/news/visa-changes");
});

test("a canonical url stored by an editor is left alone when it is already absolute", () => {
  const meta = buildMetadataFrom(
    { path: "/news/visa-changes", row: { ...row, canonicalUrl: "https://example.com/original" } },
    defaults,
  );
  expect(meta.alternates?.canonical).toBe("https://example.com/original");
});

test("a canonical path stored by an editor is made absolute", () => {
  expect(absoluteUrl("/contact")).toBe("https://goodluck.services/contact");
});

test("a published date turns the open graph type into an article", () => {
  const meta = buildMetadataFrom(
    { path: "/news/visa-changes", title: "Visa changes", publishedTime: "2026-01-04", row },
    defaults,
  );
  expect(meta.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-04" });
});
