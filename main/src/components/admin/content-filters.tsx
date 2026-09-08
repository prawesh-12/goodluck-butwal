"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Select } from "./repeater";

const STATUSES = ["draft", "scheduled", "published", "archived"];

export type OfficeOption = { id: string; name: string };

// Shared by the offices, team and partners lists. Search waits for a pause in typing, so a long
// name is one query rather than twelve.
export function ContentFilters({
  placeholder,
  offices,
}: {
  placeholder: string;
  offices?: OfficeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (q) next.set("q", q);
      else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, params, pathname, router]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next}`);
  };

  return (
    <form className="admin-filters" onSubmit={(e) => e.preventDefault()}>
      <label className="admin-field">
        <span className="t-small">Search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      </label>

      <Select
        label="Status"
        defaultValue={params.get("status") ?? ""}
        onChange={(value) => set("status", value)}
        options={[{ value: "", label: "Any" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
      />

      {offices ? (
        <Select
          label="Office"
          defaultValue={params.get("office") ?? ""}
          onChange={(value) => set("office", value)}
          options={[
            { value: "", label: "Any" },
            ...offices.map((office) => ({ value: office.id, label: office.name })),
          ]}
        />
      ) : null}
    </form>
  );
}
