"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/admin/alert-dialog";

// beforeunload covers a closed tab. The click handler covers admin navigation, which Next does
// without a page load so the browser never fires beforeunload.
export function UnsavedGuard({ dirty }: { dirty: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;

    const warnOnClose = (event: BeforeUnloadEvent) => event.preventDefault();

    const warnOnLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (!link || link.target === "_blank") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;

      event.preventDefault();
      event.stopPropagation();
      setPending(href);
    };

    window.addEventListener("beforeunload", warnOnClose);
    document.addEventListener("click", warnOnLink, true);

    return () => {
      window.removeEventListener("beforeunload", warnOnClose);
      document.removeEventListener("click", warnOnLink, true);
    };
  }, [dirty]);

  return (
    <AlertDialog open={pending !== null} onOpenChange={(open) => (open ? null : setPending(null))}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>Your changes on this page will be lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay here</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const href = pending;
              setPending(null);
              if (href) router.push(href);
            }}
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
