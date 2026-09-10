"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth/client";
import { Alert, AlertDescription } from "@/components/ui/admin/alert";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/admin/card";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>That link did not work</CardTitle>
          <CardDescription>
            A reset link works once and expires in an hour. Ask for a new one from the sign in screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/admin/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>At least 12 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            const password = String(new FormData(event.currentTarget).get("password"));
            const result = await resetPassword({ newPassword: password, token });
            setBusy(false);
            if (result.ok) {
              router.replace("/admin/login");
              return;
            }
            setError("That link has already been used or has expired.");
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" name="password" type="password" required minLength={12} autoComplete="new-password" />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving..." : "Save the password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="admin flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
