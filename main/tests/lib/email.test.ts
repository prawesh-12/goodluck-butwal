import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail, sendEmailQuietly, toPlainText } from "@/lib/email";

const KEY = "RESEND_API_KEY";
const FROM = "RESEND_FROM_EMAIL";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env[KEY] = "re_test_key";
  process.env[FROM] = "Goodluck <hello@example.com>";
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env[KEY];
  delete process.env[FROM];
});

const body = () => JSON.parse(fetchMock.mock.calls[0][1].body as string);

test("a message is posted to Resend with the from address and both body formats", async () => {
  await sendEmail({ to: "someone@example.com", subject: "Hello", html: "<p>Hi there</p>" });

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(init.headers.Authorization).toBe("Bearer re_test_key");
  expect(body()).toMatchObject({
    from: "Goodluck <hello@example.com>",
    to: ["someone@example.com"],
    subject: "Hello",
    html: "<p>Hi there</p>",
    text: "Hi there",
  });
});

test("a reply-to address is passed through so staff can answer the sender", async () => {
  await sendEmail({ to: "staff@example.com", subject: "New enquiry", html: "<p>x</p>", replyTo: "asker@example.com" });
  expect(body().reply_to).toBe("asker@example.com");
});

test("sending without an api key throws rather than posting nothing", async () => {
  delete process.env[KEY];
  await expect(sendEmail({ to: "a@example.com", subject: "s", html: "<p>x</p>" })).rejects.toThrow(/RESEND_API_KEY/);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("a rejection from Resend throws out of sendEmail", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 422, text: async () => "bad from address" });
  await expect(sendEmail({ to: "a@example.com", subject: "s", html: "<p>x</p>" })).rejects.toThrow(/422/);
});

// The row is written before any of this runs, so a bad day at Resend must not surface as a
// failed submission.
test("sendEmailQuietly swallows a Resend failure and reports it did not send", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => "upstream down" });
  await expect(sendEmailQuietly({ to: "a@example.com", subject: "s", html: "<p>x</p>" })).resolves.toBe(false);
});

test("sendEmailQuietly swallows a network error too", async () => {
  fetchMock.mockRejectedValue(new Error("socket hang up"));
  await expect(sendEmailQuietly({ to: "a@example.com", subject: "s", html: "<p>x</p>" })).resolves.toBe(false);
});

test("the logged failure carries the subject and never the message body", async () => {
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => "down" });

  await sendEmailQuietly({ to: "a@example.com", subject: "New enquiry ENQ-1", html: "<p>my private situation</p>" });

  expect(logged).toHaveBeenCalledWith("email failed", { subject: "New enquiry ENQ-1" });
  expect(JSON.stringify(logged.mock.calls)).not.toContain("private");
});

test("the plain text alternative drops tags and keeps the words", () => {
  expect(toPlainText("<p>Line one</p><p>Line two</p>")).toBe("Line one\nLine two");
});
