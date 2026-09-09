"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Select } from "./repeater";

// Search waits for a pause in typing, so a long name is one query rather than twelve.
export function LeadFilters({
  statuses,
  services = [],
  exportPath,
}: {
  statuses: string[];
  services?: { slug: string; name: string }[];
  exportPath: string;
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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, email, phone or reference"
        />
      </label>

      <Select
        label="Status"
        defaultValue={params.get("status") ?? ""}
        onChange={(value) => set("status", value)}
        options={[
          { value: "", label: "Any" },
          ...statuses.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
        ]}
      />

      {services.length > 0 ? (
        <Select
          label="Service"
          defaultValue={params.get("service") ?? ""}
          onChange={(value) => set("service", value)}
          options={[
            { value: "", label: "Any" },
            ...services.map((s) => ({ value: s.slug, label: s.name })),
          ]}
        />
      ) : null}

      <label className="admin-field">
        <span className="t-small">From</span>
        <input type="date" defaultValue={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} />
      </label>

      <label className="admin-field">
        <span className="t-small">To</span>
        <input type="date" defaultValue={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} />
      </label>

      <a className="admin-btn" href={`${exportPath}?${params}`}>
        Export CSV
      </a>
    </form>
  );
}
