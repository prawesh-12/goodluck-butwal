"use client";

import { useEffect, useRef, useState } from "react";

// beforeunload covers a closed tab; the link handler covers admin navigation, which Next does
// without a page load so the browser never fires it.
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
