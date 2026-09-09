import { scrub, scrubText } from "./sentry-scrub";

// Sentry over plain fetch, for the same reason Cloudinary and Resend are: the SDK costs about
// 0.6 MB compressed. This sends the same envelope their ingest endpoint expects, and nothing is
// sent without a DSN, so local runs stay silent.
type Dsn = { origin: string; projectId: string; key: string };

function parseDsn(raw: string | undefined): Dsn | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const projectId = url.pathname.replace(/^\//, "");
    if (!projectId || !url.username) return null;
    return { origin: url.origin, projectId, key: url.username };
  } catch {
    return null;
  }
}

export function sentryConfigured() {
  return parseDsn(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN) !== null;
}

export type ReportContext = { route?: string; level?: "error" | "warning" };

// Reporting must never be the reason a request fails, so every failure here is swallowed.
export async function reportError(error: unknown, context: ReportContext = {}) {
  const dsn = parseDsn(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn) return false;

  const err = error instanceof Error ? error : new Error(String(error));
  const eventId = crypto.randomUUID().replace(/-/g, "");

  const event = scrub({
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: context.level ?? "error",
    environment: process.env.NODE_ENV,
    transaction: context.route,
    exception: {
      values: [{ type: err.name, value: scrubText(err.message), stacktrace: { frames: [] } }],
    },
  });

  const envelope =
    `${JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() })}\n` +
    `${JSON.stringify({ type: "event" })}\n` +
    `${JSON.stringify(event)}\n`;

  try {
    await fetch(`${dsn.origin}/api/${dsn.projectId}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.key}`,
      },
      body: envelope,
    });
    return true;
  } catch {
    return false;
  }
}
