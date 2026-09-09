import { test, expect } from "vitest";
import { scrub, scrubText, PII_FIELDS } from "@/lib/integrations/sentry-scrub";

test("every field the plan names is redacted", () => {
  const event = { email: "sam@example.com", phone: "0400000000", full_name: "Sam", message: "help", notes: "private" };
  const clean = scrub(event) as Record<string, string>;
  for (const field of PII_FIELDS) {
    if (field in event) expect(clean[field], field).toBe("[redacted]");
  }
});

test("a nested request body is reached, not just the top level", () => {
  const event = { request: { data: { email: "sam@example.com", subject: "Visa" } } };
  const clean = scrub(event) as { request: { data: { email: string; subject: string } } };
  expect(clean.request.data.email).toBe("[redacted]");
  expect(clean.request.data.subject).toBe("Visa");
});

test("a list of submissions is scrubbed item by item", () => {
  const clean = scrub([{ email: "a@b.com" }, { email: "c@d.com" }]) as { email: string }[];
  expect(clean.map((x) => x.email)).toEqual(["[redacted]", "[redacted]"]);
});

test("fields that are not personal are left alone", () => {
  const clean = scrub({ status: "new", reference: "ENQ-1234" }) as Record<string, string>;
  expect(clean.status).toBe("new");
  expect(clean.reference).toBe("ENQ-1234");
});

test("an email inside a free text message is caught too", () => {
  expect(scrubText("Failed to send to sam@example.com after 3 tries")).toBe(
    "Failed to send to [redacted] after 3 tries",
  );
});

test("a cyclic object does not hang the reporter", () => {
  const loop: Record<string, unknown> = { email: "sam@example.com" };
  loop.self = loop;
  expect(() => scrub(loop)).not.toThrow();
});

test("a null value stays null rather than becoming the word redacted", () => {
  const clean = scrub({ phone: null, email: "a@b.com" }) as Record<string, unknown>;
  expect(clean.phone).toBe(null);
  expect(clean.email).toBe("[redacted]");
});

test("nothing is sent when no DSN is configured", async () => {
  delete process.env.SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  const { reportError, sentryConfigured } = await import("@/lib/integrations/sentry");
  expect(sentryConfigured()).toBe(false);
  await expect(reportError(new Error("boom"))).resolves.toBe(false);
});

test("a malformed DSN is treated as none, not a crash", async () => {
  process.env.SENTRY_DSN = "not-a-url";
  const { sentryConfigured } = await import("@/lib/integrations/sentry");
  expect(sentryConfigured()).toBe(false);
  delete process.env.SENTRY_DSN;
});
