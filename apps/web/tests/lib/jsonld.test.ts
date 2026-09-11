import { test, expect, vi } from "vitest";

vi.mock("@goodluck/db", () => ({ db: {} }));

const { toJsonLd, organization, event, breadcrumbs, faqPage } = await import(
  "@/lib/seo/schema"
);

test("a < inside a value cannot close the script tag", () => {
  const json = toJsonLd({ name: "<\/script><script>alert(1)</script>" });
  expect(json).not.toContain("<");
  expect(json).toContain("\\u003c");
});

test("the organization has the fields a rich result needs", () => {
  const org = organization(["https://facebook.com/goodluck"]);
  expect(org["@type"]).toBe("Organization");
  expect(org.name).toBe("Goodluck Education & Migration");
  expect(org.url).toBe("https://goodluck.services");
  expect(org.logo).toBe("https://goodluck.services/brand/logo.png");
  expect(org.sameAs).toEqual(["https://facebook.com/goodluck"]);
});

test("an organization with no social profiles leaves sameAs out", () => {
  expect(organization()).not.toHaveProperty("sameAs");
});

test("a breadcrumb trail lists its ancestors in order", () => {
  const crumbs = breadcrumbs([
    { name: "Home", path: "/" },
    { name: "News", path: "/news" },
    { name: "Visa changes", path: "/news/visa-changes" },
  ]);
  expect(crumbs.itemListElement).toEqual([
    { "@type": "ListItem", position: 1, name: "Home", item: "https://goodluck.services/" },
    { "@type": "ListItem", position: 2, name: "News", item: "https://goodluck.services/news" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Visa changes",
      item: "https://goodluck.services/news/visa-changes",
    },
  ]);
});

test("an event carries its start and end times in ISO form", () => {
  const schema = event({
    slug: "melbourne-fair",
    title: "Melbourne education fair",
    summary: "Meet our counsellors.",
    image: "",
    startsAt: new Date("2026-03-01T09:00:00Z"),
    endsAt: new Date("2026-03-01T15:30:00Z"),
    isOnline: false,
    onlineUrl: null,
    venueName: "Queen St",
    venueAddress: "2 Queen St, Melbourne",
    officeName: "Melbourne",
  });
  expect(schema.startDate).toBe("2026-03-01T09:00:00.000Z");
  expect(schema.endDate).toBe("2026-03-01T15:30:00.000Z");
});

test("an online event points at a virtual location", () => {
  const schema = event({
    slug: "webinar",
    title: "Study in Australia webinar",
    summary: "",
    image: "",
    startsAt: new Date("2026-03-01T09:00:00Z"),
    endsAt: null,
    isOnline: true,
    onlineUrl: "https://meet.example.com/webinar",
    venueName: null,
    venueAddress: null,
    officeName: "Butwal",
  });
  expect(schema.location).toEqual({
    "@type": "VirtualLocation",
    url: "https://meet.example.com/webinar",
  });
  expect(schema).not.toHaveProperty("endDate");
});

test("each faq question keeps its answer", () => {
  const schema = faqPage([{ q: "Do you charge a fee?", a: "<p>No.</p>" }]);
  expect(schema.mainEntity).toEqual([
    {
      "@type": "Question",
      name: "Do you charge a fee?",
      acceptedAnswer: { "@type": "Answer", text: "<p>No.</p>" },
    },
  ]);
});
