"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportError } from "@/lib/sentry";

// The last resort: the root layout itself failed, so this renders its own html and body and
// cannot use any component from the app.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    void reportError(error, { route: window.location.pathname });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "60px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>That page did not load</h1>
        <p style={{ color: "#4d585f", marginBottom: 24 }}>
          Something on our side failed. Please try again in a moment.
        </p>
        <Link href="/" style={{ color: "#406ae4" }}>
          Back to home
        </Link>
      </body>
    </html>
  );
}
