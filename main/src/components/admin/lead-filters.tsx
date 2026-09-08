"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Search waits for a pause in typing, so a long name is one query rather than twelve.
export function LeadFilters({ statuses, exportPath }: { statuses: string[]; exportPath: string }) {
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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, email, phone or reference"
        />
      </label>

      <label className="admin-field">
        <span className="t-small">Status</span>
        <select defaultValue={params.get("status") ?? ""} onChange={(e) => set("status", e.target.value)}>
          <option value="">Any</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field">
        <span className="t-small">From</span>
        <input type="date" defaultValue={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} />
      </label>

      <label className="admin-field">
        <span className="t-small">To</span>
        <input type="date" defaultValue={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} />
      </label>

      <a className="btn-black-sm" href={`${exportPath}?${params}`}>
        Export CSV
      </a>
    </form>
  );
}
