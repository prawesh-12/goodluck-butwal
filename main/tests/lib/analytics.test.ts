import { afterEach, expect, test, vi } from "vitest";
import { gtmId, trackFormSubmit } from "@/lib/analytics";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("no container id anywhere means nothing to render", () => {
  vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
  expect(gtmId("")).toBe(null);
  expect(gtmId(null)).toBe(null);
  expect(gtmId(undefined)).toBe(null);
});

test("an id that is not a container id is refused", () => {
  vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
  expect(gtmId("G-ABC1234")).toBe(null);
  expect(gtmId("UA-12345-1")).toBe(null);
  expect(gtmId("gtm-abc1234")).toBe(null);
  expect(gtmId("your-gtm-id-here")).toBe(null);
});

test("a container id is kept and trimmed", () => {
  expect(gtmId("  GTM-ABC1234  ")).toBe("GTM-ABC1234");
});

test("the environment variable is the fallback", () => {
  vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-FALLBACK1");
  expect(gtmId("")).toBe("GTM-FALLBACK1");
});

test("the setting wins over the environment variable", () => {
  vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-FALLBACK1");
  expect(gtmId("GTM-FROMDB1")).toBe("GTM-FROMDB1");
});

test("a successful submission pushes one form_submit event", () => {
  const fake: { dataLayer?: Record<string, unknown>[] } = {};
  vi.stubGlobal("window", fake);

  trackFormSubmit("enquiry", "ENQ-12345");

  expect(fake.dataLayer).toEqual([
    { event: "form_submit", form_name: "enquiry", reference: "ENQ-12345" },
  ]);
});

test("a submission without a reference pushes only the event and the form name", () => {
  const fake: { dataLayer?: Record<string, unknown>[] } = { dataLayer: [{ event: "gtm.js" }] };
  vi.stubGlobal("window", fake);

  trackFormSubmit("booking");

  expect(fake.dataLayer?.[1]).toEqual({ event: "form_submit", form_name: "booking" });
});

test("nothing is pushed on the server", () => {
  expect(() => trackFormSubmit("event_registration")).not.toThrow();
});
