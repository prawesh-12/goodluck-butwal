import { customAlphabet } from "nanoid";

// No lookalike characters, so a reference code read down the phone cannot be mistyped.
const code = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 8);

export function referenceCode(prefix: "ENQ" | "CON") {
  return `${prefix}-${code()}`;
}

// The raw IP never lands in the database. The salt makes the hash useless if the table leaks.
export async function hashIp(ip: string) {
  const data = new TextEncoder().encode(`${process.env.IP_HASH_SALT ?? ""}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "0.0.0.0"
  );
}
