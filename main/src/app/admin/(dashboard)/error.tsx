"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { EmptyState } from "@/components/shared/admin/states";

// The thrown error is for the logs, never for the screen: it carries table names and stack
// frames that mean nothing to the person reading it.
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description="We couldn't load this page. Try again, and tell us if it keeps happening."
      action={
        <Button onClick={reset}>
          <RotateCw />
          Try again
        </Button>
      }
    />
  );
}
