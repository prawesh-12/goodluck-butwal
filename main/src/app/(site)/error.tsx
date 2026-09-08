"use client";

import { useEffect } from "react";
import { ErrorBlock } from "@/components/error-block";
import { reportError } from "@/lib/sentry";

// Shows the approved error panel rather than Next's default page, and reports the failure.
// The message is never shown to the visitor: it can carry a query, a path or a stack.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportError(error, { route: window.location.pathname });
  }, [error]);

  return (
    <ErrorBlock
      badge="Something went wrong"
      code="500"
      title="That page did not load"
      lead="Something on our side failed. Try again, and if it keeps happening please tell us."
      action={
        <button type="button" onClick={reset} className="btn-black">
          Try again
        </button>
      }
    />
  );
}
