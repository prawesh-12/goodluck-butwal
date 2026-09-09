"use client";

import { ErrorBlock } from "@/components/shared/error-block";

// Shows the approved error panel rather than Next's default page. The message is never shown
// to the visitor: it can carry a query, a path or a stack.
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
