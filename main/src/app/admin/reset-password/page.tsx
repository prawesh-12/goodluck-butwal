"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="admin-login-card">
        <h1 className="t-h4">That link did not work</h1>
        <p className="t-small">
          A reset link works once and expires in an hour. Ask for a new one from the sign in
          screen.
        </p>
        <Link className="admin-btn" href="/admin/login">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className="admin-login-card"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        const password = String(new FormData(event.currentTarget).get("password"));
        const result = await resetPassword({ newPassword: password, token });
        setBusy(false);
        if (!result.ok) {
          setError(result.error ?? "That link has already been used or has expired.");
          return;
        }
        router.replace("/admin/login");
      }}
    >
      <h1 className="t-h4">Choose a new password</h1>

      <label className="admin-field">
        <span className="t-small">New password</span>
        <input name="password" type="password" required minLength={12} autoComplete="new-password" />
        <span className="t-small admin-help">At least 12 characters.</span>
      </label>

      {error ? (
        <p role="alert" className="t-small admin-error">
          {error}
        </p>
      ) : null}

      <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
        {busy ? "Saving" : "Save the password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="admin admin-login">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
