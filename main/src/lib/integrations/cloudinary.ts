// Plain fetch, not the SDK: the signature is one SHA-1 that crypto.subtle already does.

export type ImageWidth = 320 | 640 | 960 | 1280 | 1920;
export type AllowedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export type UploadedImage = {
  publicId: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
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

export function imageUrl(publicId: string, width: ImageWidth = 960) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}

export async function uploadImage(file: Blob, folder: string): Promise<UploadedImage> {
  const { cloudName, apiKey, apiSecret } = config();
  const signed = { folder, timestamp: Math.floor(Date.now() / 1000) };

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("folder", signed.folder);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", await signParams(signed, apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  if (!res.ok) {
    throw new Error(`Cloudinary rejected the upload (${res.status}): ${await res.text()}`);
  }

  const result = (await res.json()) as {
    public_id: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
    secure_url: string;
  };
  return {
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format: result.format,
    secureUrl: result.secure_url,
  };
}

export async function deleteImage(publicId: string) {
  const { cloudName, apiKey, apiSecret } = config();
  const signed = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };

  const body = new FormData();
  body.append("api_key", apiKey);
  body.append("public_id", signed.public_id);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", await signParams(signed, apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
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

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end));
}

// The mime type and filename are attacker-controlled. The first bytes are not.
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && ascii(bytes, 1, 4) === "PNG") return "image/png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  if (ascii(bytes, 4, 8) === "ftyp" && ascii(bytes, 8, 12) === "avif") return "image/avif";
  return null;
}
