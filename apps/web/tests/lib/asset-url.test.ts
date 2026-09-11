import { test, expect } from "vitest";
import { assetId, assetSrcSet, assetUrl, mediaUrl, videoStreamUrl, videoUrl } from "@/lib/utils/media-url";

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const base = `https://res.cloudinary.com/${cloud}`;

test("a path under public maps onto the public id already in the media library", () => {
  expect(assetId("/images/hero/sky-v2.webp")).toBe("goodluck/hero/sky-v2");
  expect(assetId("/brand/logo.png")).toBe("goodluck/brand/logo");
  expect(assetId("/videos/goodluck-education.mp4")).toBe("goodluck/videos/goodluck-education");
  // Cloudinary hyphenates a filename on upload, so a reference to the original has to as well.
  expect(assetId("/images/news/Top 10-Part-Time-Jobs.webp")).toBe("goodluck/news/Top-10-Part-Time-Jobs");
});

test("a path resolves to a sized cloudinary url with no lookup", () => {
  expect(assetUrl("/images/hero/sky-v2.webp", 640)).toBe(`${base}/image/upload/f_auto,q_auto:eco,c_limit,w_640/goodluck/hero/sky-v2`);
});

test("an svg is delivered as itself, with no transformation and no srcset", () => {
  expect(assetUrl("/images/flags/australia.svg")).toBe(`${base}/image/upload/goodluck/flags/australia.svg`);
  expect(assetSrcSet("/images/flags/australia.svg")).toBeUndefined();
});

test("a srcset offers every width the site ships", () => {
  const set = assetSrcSet("/images/destinations/australia-hero.webp");
  expect(set).toBe(
    [320, 640, 960, 1280]
      .map((w) => `${base}/image/upload/f_auto,q_auto:eco,c_limit,w_${w}/goodluck/destinations/australia-hero ${w}w`)
      .join(", "),
  );
});

test("a url built by mediaUrl still gets a full srcset", () => {
  const url = mediaUrl({ kind: "cloudinary", staticPath: null, cloudinaryPublicId: "goodluck/team/olivia" }, 640);
  expect(url).toBe(`${base}/image/upload/f_auto,q_auto:eco,c_limit,w_640/goodluck/team/olivia`);
  expect(assetSrcSet(url)).toContain(`${base}/image/upload/f_auto,q_auto:eco,c_limit,w_1280/goodluck/team/olivia 1280w`);
  expect(assetUrl(url, 320)).toBe(`${base}/image/upload/f_auto,q_auto:eco,c_limit,w_320/goodluck/team/olivia`);
});

test("a media row seeded from public is served from cloudinary, not the origin", () => {
  const row = { kind: "static" as const, staticPath: "/images/team/olivia.webp", cloudinaryPublicId: null };
  expect(mediaUrl(row, 640)).toBe(`${base}/image/upload/f_auto,q_auto:eco,c_limit,w_640/goodluck/team/olivia`);
});

test("something that is not a path is left alone", () => {
  expect(assetUrl("data:image/gif;base64,R0lGOD")).toBe("data:image/gif;base64,R0lGOD");
  expect(assetUrl("")).toBe("");
  expect(assetSrcSet("data:image/gif;base64,R0lGOD")).toBeUndefined();
});

test("a video is transcoded on the way out and has an hls ladder", () => {
  expect(videoUrl("/videos/visa-guidance.mp4", 640)).toBe(`${base}/video/upload/q_auto,w_640,c_limit/goodluck/videos/visa-guidance.mp4`);
  expect(videoStreamUrl("/videos/visa-guidance.mp4")).toBe(`${base}/video/upload/sp_auto/goodluck/videos/visa-guidance.m3u8`);
});
