"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export type FilterSelect = {
  name: string;
  label: string;
  anyLabel: string;
  options: { value: string; label: string }[];
};

// Search waits for a pause in typing, so a long word is one query rather than twelve.
export function ContentFilters({ placeholder, selects }: { placeholder: string; selects: FilterSelect[] }) {
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

      {selects.map((select) => (
        <label key={select.name} className="admin-field">
          <span className="t-small">{select.label}</span>
          <select defaultValue={params.get(select.name) ?? ""} onChange={(e) => set(select.name, e.target.value)}>
            <option value="">{select.anyLabel}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </form>
  );
}
