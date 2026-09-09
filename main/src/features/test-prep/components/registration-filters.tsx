"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Select } from "@/components/shared/admin/repeater";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent } from "@/components/ui/admin/card";

export type BatchOption = { id: string; label: string };

// Search waits for a pause in typing, so a long name is one query rather than twelve.
export function RegistrationFilters({
  batches,
  statuses,
  exportPath,
}: {
  batches: BatchOption[];
  statuses: string[];
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
        <form className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="reg-search">Search</Label>
            <Input id="reg-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or phone" />
          </div>

          <Select
            label="Batch"
            defaultValue={params.get("batch") ?? ""}
            onChange={(value) => set("batch", value)}
            options={[
              { value: "", label: "Every batch" },
              ...batches.map((b) => ({ value: b.id, label: b.label })),
            ]}
          />

          <Select
            label="Status"
            defaultValue={params.get("status") ?? ""}
            onChange={(value) => set("status", value)}
            options={[{ value: "", label: "Any" }, ...statuses.map((s) => ({ value: s, label: s }))]}
          />

          <div className="space-y-1.5">
            <Label htmlFor="reg-from">From</Label>
            <Input id="reg-from" type="date" defaultValue={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-to">To</Label>
            <Input id="reg-to" type="date" defaultValue={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
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
