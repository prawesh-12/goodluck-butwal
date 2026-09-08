import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { reportError, sentryConfigured } from "@/lib/sentry";

const DSN = "https://abc123@o12345.ingest.sentry.io/6789";
const sent = vi.fn();

beforeEach(() => {
  delete process.env.SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  sent.mockReset().mockResolvedValue(new Response("", { status: 200 }));
  vi.stubGlobal("fetch", sent);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("nothing is sent when no DSN is set", async () => {
  expect(await reportError(new Error("boom"))).toBe(false);
  expect(sent).not.toHaveBeenCalled();
  expect(sentryConfigured()).toBe(false);
});

// The two error screens run in the browser, where only NEXT_PUBLIC_ names exist, so this one
// name has to be enough on its own.
test("the public name alone is enough", async () => {
  process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
  expect(sentryConfigured()).toBe(true);
  expect(await reportError(new Error("boom"))).toBe(true);

  const [url, init] = sent.mock.calls[0];
  expect(url).toBe("https://o12345.ingest.sentry.io/api/6789/envelope/");
  expect(init.headers["X-Sentry-Auth"]).toContain("sentry_key=abc123");
});

test("a DSN that is not a URL is ignored rather than thrown", async () => {
  process.env.SENTRY_DSN = "not-a-dsn";
  expect(await reportError(new Error("boom"))).toBe(false);
  expect(sent).not.toHaveBeenCalled();
});

test("an email in the message never reaches Sentry", async () => {
  process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
  await reportError(new Error("failed for sam@example.com"));
  expect(sent.mock.calls[0][1].body).not.toContain("sam@example.com");
});

// Reporting must never be the reason a request fails.
test("a failed send is swallowed", async () => {
  process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
  sent.mockRejectedValue(new Error("network down"));
  await expect(reportError(new Error("boom"))).resolves.toBe(false);
});
