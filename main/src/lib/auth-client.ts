"use client";

// Two plain calls against the Better Auth endpoints rather than its React client. That client
// pulls zod, jose, kysely and nanostores into the browser bundle for what amounts to two POSTs.

type Result = { ok: boolean; error?: string };

async function post(path: string, body?: unknown): Promise<Result> {
  const res = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (res.ok) return { ok: true };

  const detail = (await res.json().catch(() => null)) as { message?: string } | null;
  return { ok: false, error: detail?.message };
}

export const signIn = {
  email: (credentials: { email: string; password: string }) => post("sign-in/email", credentials),
};

export const signOut = () => post("sign-out");

export const requestPasswordReset = (body: { email: string; redirectTo?: string }) =>
  post("request-password-reset", body);

export const resetPassword = (body: { newPassword: string; token: string }) =>
  post("reset-password", body);
