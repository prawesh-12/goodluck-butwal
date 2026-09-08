// Google's share dialog hands out a /maps/embed?pb=... URL that needs no key. It is undocumented
// and Google can retire it, so an address plus the Embed API key is the supported path and the
// one used whenever an office or event has not been given a URL of its own.
const EMBED_API = "https://www.google.com/maps/embed/v1/place";

export function mapsEmbedSrc(stored: string | null | undefined, address: string): string | null {
  const pasted = stored?.trim();
  if (pasted?.startsWith("https://")) return pasted;

  const key = process.env.NEXT_PUBLIC_MAPS_API_KEY?.trim();
  const place = address.trim();
  if (!key || !place) return null;

  return `${EMBED_API}?key=${encodeURIComponent(key)}&q=${encodeURIComponent(place)}`;
}
