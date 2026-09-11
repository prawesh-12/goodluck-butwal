"use client";

import { ErrorBlock } from "@/components/shared/error-block";

// The error message is never shown: it can carry a query, a path or a stack.
export default function Error({ reset }: { reset: () => void }) {
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
