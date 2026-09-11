export type MediaRow = {
  kind: "static" | "cloudinary" | null;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
};

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Stops at 1280. The pictures in public/ are already squeezed hard, and asked for at their own
// width Cloudinary hands back a re-encode several times bigger than the file it started from
// (the hero meadow: 262 KB on disk, 1.1 MB at w_1920). Below 1280 it wins on every one of them.
export const IMAGE_WIDTHS = [320, 640, 960, 1280] as const;
// The hero sky is the one source wide enough to be worth serving past 1280.
export const WIDE_IMAGE_WIDTHS = [...IMAGE_WIDTHS, 1920, 2560] as const;

// A space becomes a hyphen because that is what Cloudinary does to a filename on upload.
export function assetId(path: string) {
  const name = path
    .replace(/^\/images\//, "/")
    .replace(/^\//, "")
    .replace(/\.[^./]+$/, "")
    .replace(/\s+/g, "-");
  return `goodluck/${name}`;
}

function deliver(kind: "image" | "video", transform: string, id: string) {
  return `https://res.cloudinary.com/${CLOUD}/${kind}/upload/${transform ? `${transform}/` : ""}${id}`;
}

// c_limit everywhere: without it a source narrower than the asked-for width is upscaled, which
// costs more bytes than the original and shows no more detail.
const WIDTH = /(\/image\/upload\/[^/]*?)w_\d+/;
const resized = (url: string, width: number) => url.replace(WIDTH, `$1w_${width}`);

// f_auto would rasterise an SVG, which costs more bytes and looks worse than the original.
// "eco" is enough for a card. A full-bleed image shows every compression artefact, so the hero asks for "good".
export type Quality = "eco" | "good" | "auto";
export type Format = "auto" | "avif";

export function assetUrl(path: string, width = 960, quality: Quality = "eco", format: Format = "auto") {
  if (!path.startsWith("/")) return resized(path, width);
  if (path.endsWith(".svg")) return `${deliver("image", "", assetId(path))}.svg`;
  const q = quality === "auto" ? "q_auto" : `q_auto:${quality}`;
  return deliver("image", `f_${format},${q},c_limit,w_${width}`, assetId(path));
}

export function assetSrcSet(src: string, widths: readonly number[] = IMAGE_WIDTHS, quality: Quality = "eco", format: Format = "auto") {
  if (src.endsWith(".svg")) return undefined;
  if (!src.startsWith("/") && !WIDTH.test(src)) return undefined;
  return widths.map((w) => `${assetUrl(src, w, quality, format)} ${w}w`).join(", ");
}

// Same rule as the admin picker, kept here so a public page never imports an admin module.
export function mediaUrl(row: MediaRow, width = 640) {
  if (row.kind === "cloudinary") return deliver("image", `f_auto,q_auto:eco,c_limit,w_${width}`, row.cloudinaryPublicId ?? "");
  return row.staticPath ? assetUrl(row.staticPath, width) : "";
}

export function videoUrl(path: string, width = 960) {
  if (!path.startsWith("/")) return path;
  return `${deliver("video", `q_auto,w_${width},c_limit`, assetId(path))}.mp4`;
}

export function videoStreamUrl(path: string) {
  if (!path.startsWith("/")) return path;
  return `${deliver("video", "sp_auto", assetId(path))}.m3u8`;
}
