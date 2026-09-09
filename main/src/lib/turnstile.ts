const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// No secret configured means no bot check. That is only ever true in local development, and it
// has to be loud rather than quietly letting everything through in production.
function turnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | undefined, ip?: string) {
  if (!turnstileConfigured()) {
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }
  if (!token) return false;

  const body = new FormData();
  body.append("secret", process.env.TURNSTILE_SECRET_KEY!);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  const res = await fetch(VERIFY_URL, { method: "POST", body });
  if (!res.ok) return false;

  const result = (await res.json()) as { success: boolean };
  return result.success;
}
