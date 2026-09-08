"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
            minLength={12}
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p role="alert" className="t-small admin-error">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-blue" disabled={busy}>
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
