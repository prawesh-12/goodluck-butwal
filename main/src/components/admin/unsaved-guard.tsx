"use client";

import { useEffect, useRef, useState } from "react";

// Warns before a half-written article is lost. The browser's own dialog handles a closed tab or
// a typed address; the link handler covers moving around inside the admin, which the browser
// never sees because Next navigates without a page load.
export function UnsavedGuard({ formId }: { formId: string }) {
  const [dirty, setDirty] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const touch = () => setDirty(true);
    const submitted = () => {
      saving.current = true;
      setDirty(false);
    };

    form.addEventListener("input", touch);
    form.addEventListener("change", touch);
    form.addEventListener("submit", submitted);

    return () => {
      form.removeEventListener("input", touch);
      form.removeEventListener("change", touch);
      form.removeEventListener("submit", submitted);
    };
  }, [formId]);

  useEffect(() => {
    if (!dirty) return;

    const warnOnClose = (event: BeforeUnloadEvent) => {
      if (saving.current) return;
      event.preventDefault();
    };

    // Next navigates without a page load, so the browser never fires beforeunload for a link
    // inside the admin. This catches those before the click turns into a navigation.
    const warnOnLink = (event: MouseEvent) => {
      if (saving.current) return;
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (!link || link.target === "_blank") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      if (!window.confirm("You have changes that are not saved. Leave anyway?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", warnOnClose);
    document.addEventListener("click", warnOnLink, true);

    return () => {
      window.removeEventListener("beforeunload", warnOnClose);
      document.removeEventListener("click", warnOnLink, true);
    };
  }, [dirty]);

  return null;
}
