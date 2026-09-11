"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

type Connection = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", fn: () => void) => void;
  removeEventListener?: (type: "change", fn: () => void) => void;
};

const connection = () => (typeof navigator === "undefined" ? undefined : (navigator as Navigator & { connection?: Connection }).connection);

export const slowConnection = (c: Connection | undefined) => c?.saveData === true || ["slow-2g", "2g", "3g"].includes(c?.effectiveType ?? "");

const subscribe = (fn: () => void) => {
  const c = connection();
  c?.addEventListener?.("change", fn);
  return () => c?.removeEventListener?.("change", fn);
};

const Slow = createContext(false);

// One subscription for the whole page. The server snapshot is false, so the first client render
// matches the HTML; on a slow connection the links re-render once after hydration.
export function SlowConnectionProvider({ children }: { children: ReactNode }) {
  const slow = useSyncExternalStore(subscribe, () => slowConnection(connection()), () => false);
  return <Slow.Provider value={slow}>{children}</Slow.Provider>;
}

// On a slow or data-saver connection the viewport prefetch is off and the route is fetched when
// the visitor shows intent instead, so a scroll down the page does not fetch thirty routes.
// Browsers without navigator.connection, and everyone on a fast one, keep Next's default.
export function Link({ prefetch, ...props }: ComponentProps<typeof NextLink>) {
  const slow = useContext(Slow);
  const router = useRouter();
  if (!slow) return <NextLink prefetch={prefetch} {...props} />;
  const intent = () => { if (typeof props.href === "string") router.prefetch(props.href); };
  return <NextLink {...props} prefetch={false} onPointerEnter={intent} onFocus={intent} onTouchStart={intent} />;
}
