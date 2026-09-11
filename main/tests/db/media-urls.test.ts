import { test, expect } from "vitest";
import { mediaUrl } from "@/lib/utils/media-url";
import { listArticles } from "@/features/posts/queries";
import { listPartnerLogos } from "@/features/partners/queries";
import { listTeam } from "@/features/team/queries";

const hasDb = Boolean(process.env.DATABASE_URL);

test("mediaUrl builds a delivery url whether the row is on cloudinary or seeded from public", () => {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const onCloudinary = { kind: "cloudinary" as const, staticPath: null, cloudinaryPublicId: "goodluck/team/olivia-graces" };
  const inPublic = { kind: "static" as const, staticPath: "/images/team/olivia-graces.webp", cloudinaryPublicId: null };

  expect(mediaUrl(onCloudinary, 640)).toBe(`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto:eco,c_limit,w_640/goodluck/team/olivia-graces`);
  expect(mediaUrl(inPublic, 640)).toBe(`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto:eco,c_limit,w_640/goodluck/team/olivia-graces`);
});

test.runIf(hasDb)("no CMS query hands back an origin path", async () => {
  const [articles, team, logos] = await Promise.all([listArticles(), listTeam(), listPartnerLogos()]);

  const urls = [...articles.map((a) => a.image), ...team.map((m) => m.photo), ...logos].filter(Boolean);

  expect(urls.length).toBeGreaterThan(0);
  expect(urls.filter((url) => url.startsWith("/"))).toEqual([]);
});
