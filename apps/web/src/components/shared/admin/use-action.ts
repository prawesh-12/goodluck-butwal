"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export type FieldErrors = Record<string, string[] | undefined>;

// Every server action in this repo answers with the same shape, so one hook covers the whole
// lifecycle: disable the button, keep what the user typed, toast the outcome, put the messages
// back beside their fields.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const run = useCallback(
    async <T>(
      call: () => Promise<ActionResult<T>>,
      { success, failure }: { success: string; failure: string },
    ): Promise<T | null> => {
      if (busy) return null;
      setBusy(true);
      try {
        const result = await call();
        if (result.ok) {
          setErrors({});
          toast.success(success);
          return result.data;
        }
        setErrors(result.fieldErrors ?? {});
        toast.error(failure, { description: result.error });
        return null;
      } catch {
        toast.error(failure, { description: "Something went wrong. Please try again." });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  return { busy, errors, setErrors, run };
}

// The first field carrying a message is where the user has to look, so the page scrolls there
// instead of leaving them to hunt.
export function focusFirstError(errors: FieldErrors) {
  const first = Object.keys(errors).find((key) => errors[key]?.length);
  if (!first) return;
  const field = document.querySelector<HTMLElement>(`[data-field="${first}"] :is(input, textarea, button)`);
  field?.focus();
  field?.scrollIntoView({ block: "center", behavior: "smooth" });
}
