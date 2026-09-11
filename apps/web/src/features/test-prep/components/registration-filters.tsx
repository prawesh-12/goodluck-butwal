"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/shared/admin/filter-bar";
import { statusLabel } from "@/components/shared/admin/list-ui";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";

export type BatchOption = { id: string; label: string };

export function RegistrationFilters({ batches, statuses }: { batches: BatchOption[]; statuses: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next}`);
  };

  return (
    <div className="space-y-3">
      <FilterBar
        searchPlaceholder="Search by name, email or phone"
        filters={[
          {
            name: "batch",
            label: "Batch",
            anyLabel: "Every batch",
            options: batches.map((batch) => ({ value: batch.id, label: batch.label })),
          },
          {
            name: "status",
            label: "Status",
            anyLabel: "Any status",
            options: statuses.map((status) => ({ value: status, label: statusLabel(status) })),
          },
        ]}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="registered-from" className="text-xs text-muted-foreground">
            Registered from
          </Label>
          <Input
            id="registered-from"
            type="date"
            className="w-44"
            value={params.get("from") ?? ""}
            onChange={(event) => set("from", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="registered-to" className="text-xs text-muted-foreground">
            Registered to
          </Label>
          <Input
            id="registered-to"
            type="date"
            className="w-44"
            value={params.get("to") ?? ""}
            onChange={(event) => set("to", event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
