import { test, expect, beforeEach } from "vitest";
import { mapsEmbedSrc } from "@/lib/maps";

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_MAPS_API_KEY;
});

test("a URL an admin pasted is used as it stands", () => {
  const pasted = "https://www.google.com/maps/embed?pb=!1m18!1m12";
  expect(mapsEmbedSrc(pasted, "1 Collins St, Melbourne")).toBe(pasted);
});

test("an address becomes an Embed API url when a key is set", () => {
  process.env.NEXT_PUBLIC_MAPS_API_KEY = "test-key";
  expect(mapsEmbedSrc(null, "1 Collins St, Melbourne")).toBe(
    "https://www.google.com/maps/embed/v1/place?key=test-key&q=1%20Collins%20St%2C%20Melbourne",
  );
});

test("no key and no pasted url means no map rather than a broken frame", () => {
  expect(mapsEmbedSrc(null, "1 Collins St, Melbourne")).toBe(null);
});

test("an office with no address gets no map", () => {
  process.env.NEXT_PUBLIC_MAPS_API_KEY = "test-key";
  expect(mapsEmbedSrc("", "   ")).toBe(null);
});

// A half-typed value in the admin field must not be sent to Google as a frame source.
test("a pasted value that is not a url falls back to the address", () => {
  process.env.NEXT_PUBLIC_MAPS_API_KEY = "test-key";
  expect(mapsEmbedSrc("collins street", "1 Collins St, Melbourne")).toContain("/embed/v1/place");
});
