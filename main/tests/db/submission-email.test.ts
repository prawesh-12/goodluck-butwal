import { test, expect, vi, beforeEach, afterEach } from "vitest";

// The route modules open a database client as they load, so they are imported inside the tests
// and only where a connection string exists.
const hasDb = Boolean(process.env.DATABASE_URL);

let fetchMock: ReturnType<typeof vi.fn>;
let turnstilePasses = true;

// Neon speaks over fetch as well, so only the two outbound services are answered here and
// everything else goes to the real network.
beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "Goodluck <hello@example.com>";
  turnstilePasses = true;
  const real = globalThis.fetch;
  fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("api.resend.com")) {
      return Promise.resolve(new Response("", { status: 200 }));
    }
    if (url.includes("challenges.cloudflare.com")) {
      return Promise.resolve(Response.json({ success: turnstilePasses }));
    }
    return real(input, init);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.TURNSTILE_SECRET_KEY;
});

const post = (body: unknown) =>
  new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const resendCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes("api.resend.com"));

const ROUTES = [
  ["enquiry", () => import("@/app/api/enquiries/route")],
  ["consultation", () => import("@/app/api/consultations/route")],
  ["test prep registration", () => import("@/app/api/test-prep/register/route")],
] as const;

// Every route parses before it does anything else, so a bad payload must not reach the database
// or Resend. Nothing here is mocked away: the request genuinely stops at the schema.
for (const [name, load] of ROUTES) {
  test.runIf(hasDb)(`an invalid ${name} is refused and sends no email`, async () => {
    const { POST } = await load();
    const response = await POST(post({ fullName: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false });
    expect(resendCalls()).toHaveLength(0);
  });
}

test.runIf(hasDb)("an invalid event registration is refused and sends no email", async () => {
  const { POST } = await import("@/app/api/events/[id]/register/route");
  const response = await POST(post({ fullName: "" }), { params: Promise.resolve({ id: "not-a-uuid" }) });

  expect(response.status).toBe(400);
  expect(resendCalls()).toHaveLength(0);
});

test.runIf(hasDb)("a submission that fails the bot check is refused before any email", async () => {
  // Turnstile only runs when it is configured, so the key is set to reach that gate at all.
  process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
  turnstilePasses = false;
  const { POST } = await import("@/app/api/enquiries/route");

  const response = await POST(
    post({
      fullName: "Sam Tan",
      email: "sam@example.com",
      message: "I would like to study nursing in Australia please.",
      turnstileToken: "dummy",
      sourcePage: "/contact",
    }),
  );

  expect(response.status).toBe(400);
  expect(resendCalls()).toHaveLength(0);
});
