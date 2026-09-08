type Message = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

// Resend over plain fetch. Their SDK is large and the Worker bundle is capped.
export async function sendEmail({ to, subject, html, replyTo }: Message) {
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
      reply_to: replyTo,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend rejected the message (${res.status}): ${await res.text()}`);
  }
}
