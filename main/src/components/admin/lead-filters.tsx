"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Select } from "./repeater";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

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
    <Card>
      <CardContent className="pt-6">
        <form className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="lead-search">Search</Label>
            <Input
              id="lead-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email, phone or reference"
            />
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="lead-from">From</Label>
            <Input id="lead-from" type="date" defaultValue={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-to">To</Label>
            <Input id="lead-to" type="date" defaultValue={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} />
          </div>

          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={`${exportPath}?${params}`}>
                <Download /> Export CSV
              </a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
