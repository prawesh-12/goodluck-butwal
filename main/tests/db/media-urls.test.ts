import { test, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@db/client";
import { mediaAssets } from "@db/schema";
import { mediaUrl } from "@/lib/utils/media-url";
import { listArticles } from "@/features/posts/queries";
import { listPartnerLogos } from "@/features/partners/queries";
import { listTeam } from "@/features/team/queries";
import { listServices } from "@/features/services/queries";
import { listDestinations } from "@/features/destinations/queries";
import { getAboutContent } from "@/features/pages/queries";

const hasDb = Boolean(process.env.DATABASE_URL);

test("mediaUrl builds a delivery url for a cloudinary row and keeps the path for a static one", () => {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const onCloudinary = { kind: "cloudinary" as const, staticPath: null, cloudinaryPublicId: "goodluck/team/olivia-graces" };
  const inPublic = { kind: "static" as const, staticPath: "/images/ui/star.svg", cloudinaryPublicId: null };

  expect(mediaUrl(onCloudinary, 640)).toBe(`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_640/goodluck/team/olivia-graces`);
  expect(mediaUrl(inPublic, 640)).toBe("/images/ui/star.svg");
});

// Every public query used to select static_path on its own, so a row moved to Cloudinary kept
// rendering out of public/. Anything still serving a path has to be a row that is still static.
test.runIf(hasDb)("no public query hands back a path for an image that lives on Cloudinary", async () => {
  const [articles, team, logos, services, destinations, about] = await Promise.all([
    listArticles(),
    listTeam(),
    listPartnerLogos(),
    listServices(),
    listDestinations(),
    getAboutContent(),
  ]);

  const urls = [
    ...articles.map((a) => a.image),
    ...team.map((m) => m.photo),
    ...logos,
    ...services.map((s) => s.image),
    ...destinations.flatMap((d) => [d.flag, d.card, d.hero]),
    ...about.csr.flatMap((p) => [p.logo, p.photo ?? ""]),
  ].filter(Boolean);

  expect(urls.length).toBeGreaterThan(0);

  const paths = [...new Set(urls.filter((url) => url.startsWith("/images/")))];
  const stillStatic = await Promise.all(
    paths.map(async (path) => {
      const [row] = await db.select({ kind: mediaAssets.kind }).from(mediaAssets).where(eq(mediaAssets.staticPath, path));
      return { path, kind: row?.kind };
    }),
  );

  expect(stillStatic.filter((row) => row.kind === "cloudinary")).toEqual([]);
});
