"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/admin/card";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";
import { Alert, AlertDescription } from "@/components/ui/admin/alert";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <img src="/brand/logo.png" alt="Goodluck" className="mx-auto h-9 w-auto object-contain" />
        <Card>{children}</Card>
      </div>
    </div>
  );
}

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
      <Shell>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>We send a one-time link that expires in an hour.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <Alert>
              <AlertDescription>
                If that address has an account, a link to choose a new password is on its way.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" name="email" type="email" required autoComplete="username" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending..." : "Send the link"}
              </Button>
            </form>
          )}
          <Button type="button" variant="ghost" className="mt-3 w-full" onClick={() => setForgot(false)}>
            Back to sign in
          </Button>
        </CardContent>
      </Shell>
    );
  }

  return (
    <Shell>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Goodluck admin. Your session lasts 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <Button type="button" variant="ghost" className="mt-3 w-full" onClick={() => setForgot(true)}>
          Forgot your password
        </Button>
      </CardContent>
    </Shell>
  );
}
