"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

      <label className="admin-field">
        <span className="t-small">Status</span>
        <select defaultValue={params.get("status") ?? ""} onChange={(e) => set("status", e.target.value)}>
          <option value="">Any</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {offices ? (
        <label className="admin-field">
          <span className="t-small">Office</span>
          <select defaultValue={params.get("office") ?? ""} onChange={(e) => set("office", e.target.value)}>
            <option value="">Any</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </form>
  );
}
