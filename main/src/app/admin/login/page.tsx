"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);

  async function onReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const email = String(new FormData(event.currentTarget).get("email"));
    await requestPasswordReset({ email, redirectTo: "/admin/reset-password" });
    setBusy(false);
    // Always the same answer, so this cannot be used to find out which emails exist.
    setSent(true);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    if (!result.ok) {
      // Never say which half was wrong, it tells an attacker which emails exist.
      setError("That email and password did not match.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
  }

  if (forgot) {
    return (
      <div className="admin admin-login">
        <form onSubmit={onReset} className="admin-login-card">
          <h1 className="t-h4">Reset your password</h1>

          {sent ? (
            <p className="t-small">
              If that address has an account, a link to choose a new password is on its way. It
              works once and expires in an hour.
            </p>
          ) : (
            <>
              <label className="admin-field">
                <span className="t-small">Email</span>
                <input name="email" type="email" required autoComplete="username" />
              </label>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
                {busy ? "Sending" : "Send the link"}
              </button>
            </>
          )}

          <button type="button" className="admin-btn" onClick={() => setForgot(false)}>
            Back to sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin admin-login">
      <form onSubmit={onSubmit} className="admin-login-card">
        <h1 className="t-h4">Sign in</h1>

        <label className="admin-field">
          <span className="t-small">Email</span>
          <input name="email" type="email" required autoComplete="username" />
        </label>

        <label className="admin-field">
          <span className="t-small">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p role="alert" className="t-small admin-error">
            {error}
          </p>
        ) : null}

        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
          {busy ? "Signing in" : "Sign in"}
        </button>

        <button type="button" className="admin-btn" onClick={() => setForgot(true)}>
          Forgot your password
        </button>
      </form>
    </div>
  );
}
