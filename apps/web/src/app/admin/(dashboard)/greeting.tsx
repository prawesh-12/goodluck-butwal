"use client";

import { useSyncExternalStore } from "react";

const never = () => () => {};

const partOfDay = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

// The office clock is what makes "morning" true and the server does not know it, so the greeting
// is read from the browser and the server renders a neutral one until it hydrates.
export function Greeting({ name }: { name: string }) {
  const part = useSyncExternalStore(never, partOfDay, () => "Hello");

  return (
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      {part}
      {name ? `, ${name}` : ""}
    </h1>
  );
}
