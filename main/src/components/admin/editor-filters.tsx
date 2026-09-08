"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Select } from "./repeater";

export type FilterSelect = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
};

// Search waits for a pause in typing, so a long title is one query rather than twenty.
export function EditorialFilters({
  placeholder,
  selects,
}: {
  placeholder: string;
  selects: FilterSelect[];
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
    <form className="admin-filters" onSubmit={(event) => event.preventDefault()}>
      <label className="admin-field">
        <span className="t-small">Search</span>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder={placeholder} />
      </label>

      {selects.map((select) => (
        <Select
          key={select.name}
          label={select.label}
          defaultValue={params.get(select.name) ?? ""}
          onChange={(value) => set(select.name, value)}
          options={[{ value: "", label: "Any" }, ...select.options]}
        />
      ))}
    </form>
  );
}
