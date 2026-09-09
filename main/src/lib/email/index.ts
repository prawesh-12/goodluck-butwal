import { reportError } from "@/lib/integrations/sentry";

type Message = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

// Every message carries a plain-text alternative. Deriving it from the html keeps the two in
// step, which hand-written pairs never manage.
function toPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<hr[^>]*>/gi, "\n---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

// Resend over plain fetch. Their SDK is large and this is one signed request.
export async function sendEmail({ to, subject, html, replyTo }: Message) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set, so no mail can be sent.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: toPlainText(html),
      reply_to: replyTo,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend rejected the message (${res.status}): ${await res.text()}`);
  }
}

// The row is already saved by the time we get here, so a mail failure must not fail the request.
// It is reported and swallowed.
export async function sendEmailQuietly(message: Message) {
  try {
    await sendEmail(message);
    return true;
  } catch (error) {
    // The row is already saved, so a failed send must not fail the request. It is reported
    // instead, with the subject only: the body carries the enquirer's own words.
    console.error("email failed", { subject: message.subject });
    void reportError(error, { route: "email" });
    return false;
  }
}

export { toPlainText };
