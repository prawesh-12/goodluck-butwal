import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { assetUrl } from "@/lib/utils/media-url";
import { listDestinations } from "@/features/destinations/queries";
import { listServices } from "@/features/services/queries";
import { getAboutContent } from "@/features/pages/queries";

const hasDb = Boolean(process.env.DATABASE_URL);

test("no query outside the CMS sections reads media_assets", () => {
  for (const path of [
    "src/features/destinations/queries.ts",
    "src/features/services/queries.ts",
    "src/features/pages/queries.ts",
    "src/features/settings/queries.ts",
  ]) {
    expect(readFileSync(path, "utf8")).not.toMatch(/mediaAssets/);
  }
});

test.runIf(hasDb)("destination, service and CSR artwork comes back ready for cloudinary", async () => {
  const [destinations, services, about] = await Promise.all([listDestinations(), listServices(), getAboutContent()]);

  const refs = [
    ...destinations.flatMap((d) => [d.flag, d.card, d.hero]),
    ...services.flatMap((s) => [s.image, s.poster ?? "", s.video ?? ""]),
    ...about.csr.flatMap((p) => [p.logo, p.photo ?? ""]),
  ].filter(Boolean);

  expect(refs.length).toBeGreaterThan(0);
  expect(refs.filter((ref) => !/^\/(images|videos)\//.test(ref))).toEqual([]);
  expect(refs.every((ref) => assetUrl(ref).startsWith("https://res.cloudinary.com/"))).toBe(true);
});

test.runIf(hasDb)("every published destination and service has artwork shipped for its slug", async () => {
  const [destinations, services] = await Promise.all([listDestinations(), listServices()]);
  expect(destinations.every((d) => d.flag && d.card)).toBe(true);
  expect(destinations.filter((d) => d.hasPage).every((d) => d.hero)).toBe(true);
  expect(services.every((s) => s.image && s.video && s.poster)).toBe(true);
});
