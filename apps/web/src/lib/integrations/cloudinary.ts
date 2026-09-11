// Plain fetch, not the SDK: the signature is one SHA-1 that crypto.subtle already does.

export type ImageWidth = 320 | 640 | 960 | 1280 | 1920;
export type ResourceType = "image" | "video";

export type CloudinaryAsset = {
  publicId: string;
  resourceType: ResourceType;
  filename: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
  secureUrl: string;
};

function config() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured: cloud name, api key and api secret are all needed.");
  }
  return { cloudName, apiKey, apiSecret };
}

// Cloudinary's rule: sort signed params by name, join k=v&k=v, append the secret, SHA-1.
// file, api_key and resource_type are never signed.
export async function signParams(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign + apiSecret));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function deliver(resourceType: ResourceType, transform: string, path: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transform}/${path}`;
}

export function imageUrl(publicId: string, width: ImageWidth = 960) {
  return deliver("image", `f_auto,q_auto,w_${width}`, publicId);
}

// sp_auto is the streaming profile the eager ladder is built with, so this is the adaptive
// playlist rather than the origin file.
export function videoStreamUrl(publicId: string) {
  return deliver("video", "sp_auto", `${publicId}.m3u8`);
}

// A still frame, so a grid of videos costs one small image each instead of a video header.
export function videoPosterUrl(publicId: string, width = 320) {
  return deliver("video", `q_auto,c_limit,w_${width}`, `${publicId}.jpg`);
}

function basicAuth(apiKey: string, apiSecret: string) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

type ApiResource = {
  public_id: string;
  filename?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  created_at?: string;
  secure_url?: string;
};

function toAsset(raw: ApiResource, resourceType: ResourceType): CloudinaryAsset {
  return {
    publicId: raw.public_id,
    resourceType,
    filename: raw.filename ?? raw.public_id.split("/").pop() ?? raw.public_id,
    format: raw.format ?? "",
    width: raw.width ?? 0,
    height: raw.height ?? 0,
    bytes: raw.bytes ?? 0,
    createdAt: raw.created_at ?? "",
    secureUrl: raw.secure_url ?? "",
  };
}

// The term lands inside a Cloudinary search expression, so anything that cannot appear in a
// public id is dropped rather than escaped.
//
// Cloudinary refuses a leading wildcard, so "*team*" is a 400 rather than a substring search.
// The two clauses are what is left: a name starting with the term, or the folder named by it.
export function expression(resourceType: ResourceType, q?: string) {
  const term = (q ?? "").replace(/[^a-zA-Z0-9 _/-]/g, " ").trim().replace(/\s+/g, "*");
  if (!term) return `resource_type:${resourceType}`;
  return `resource_type:${resourceType} AND (${term}* OR public_id:goodluck/${term}/*)`;
}

export async function searchAssets(opts: {
  resourceType: ResourceType;
  q?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ assets: CloudinaryAsset[]; total: number; cursor: string | null }> {
  const { cloudName, apiKey, apiSecret } = config();

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: basicAuth(apiKey, apiSecret) },
    body: JSON.stringify({
      expression: expression(opts.resourceType, opts.q),
      max_results: opts.limit ?? 48,
      sort_by: [{ created_at: "desc" }],
      ...(opts.cursor ? { next_cursor: opts.cursor } : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Cloudinary rejected the search (${res.status}): ${await res.text()}`);
  }

  const result = (await res.json()) as {
    resources: ApiResource[];
    total_count: number;
    next_cursor?: string;
  };
  return {
    assets: result.resources.map((raw) => toAsset(raw, opts.resourceType)),
    total: result.total_count,
    cursor: result.next_cursor ?? null,
  };
}

// The browser uploads the file straight to Cloudinary, so the signature is built here and the
// secret never leaves the server. Cloudinary signs every parameter except file, api_key and
// resource_type, and rejects an upload whose signature does not cover what was actually sent.
//
// allowed_formats does the job the old server-side byte sniff did: our server no longer sees the
// bytes, and Cloudinary refuses anything outside the list before it stores it.
const ALLOWED_FORMATS: Record<ResourceType, string> = {
  image: "jpg,png,webp,avif",
  video: "mp4,webm",
};

export type UploadTicket = {
  endpoint: string;
  apiKey: string;
  params: Record<string, string>;
};

// The same eager ladder scripts/upload-assets.ts signs, so an uploaded video is reachable over
// adaptive HLS and no viewer has to pull the origin file.
export async function uploadTicket(opts: {
  resourceType: ResourceType;
  folder?: string;
  publicId?: string;
}): Promise<UploadTicket> {
  const { cloudName, apiKey, apiSecret } = config();

  const signed: Record<string, string | number> = {
    allowed_formats: ALLOWED_FORMATS[opts.resourceType],
    timestamp: Math.floor(Date.now() / 1000),
    ...(opts.publicId ? { public_id: opts.publicId, overwrite: "true", invalidate: "true" } : {}),
    ...(opts.folder ? { folder: opts.folder } : {}),
    ...(opts.resourceType === "video" ? { eager: "sp_auto", eager_async: "true" } : {}),
  };

  const params: Record<string, string> = Object.fromEntries(
    Object.entries(signed).map(([key, value]) => [key, String(value)]),
  );
  params.signature = await signParams(signed, apiSecret);

  return {
    endpoint: `https://api.cloudinary.com/v1_1/${cloudName}/${opts.resourceType}/upload`,
    apiKey,
    params,
  };
}

// What Cloudinary actually stored, read back over the Admin API. The browser reports the upload,
// so its numbers are never the ones written to the reference row.
export async function getAsset(resourceType: ResourceType, publicId: string): Promise<CloudinaryAsset | null> {
  const { cloudName, apiKey, apiSecret } = config();

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}`,
    { headers: { authorization: basicAuth(apiKey, apiSecret) }, cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Cloudinary rejected the lookup (${res.status}): ${await res.text()}`);
  }
  return toAsset((await res.json()) as ApiResource, resourceType);
}

export async function destroyAsset(resourceType: ResourceType, publicId: string) {
  const { cloudName, apiKey, apiSecret } = config();
  const signed = { invalidate: "true", public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };

  const body = new FormData();
  body.append("api_key", apiKey);
  for (const [key, value] of Object.entries(signed)) body.append(key, String(value));
  body.append("signature", await signParams(signed, apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
    method: "POST",
    body,
  });
  if (!res.ok) {
    throw new Error(`Cloudinary rejected the delete (${res.status}): ${await res.text()}`);
  }

  const result = (await res.json()) as { result: string };
  // "not found" means the file is already gone, which is the state the caller wanted.
  return result.result === "ok" || result.result === "not found";
}
