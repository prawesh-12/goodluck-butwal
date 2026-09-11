"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { FilterBar, type Filter } from "@/components/shared/admin/filter-bar";
import { Button } from "@/components/ui/admin/button";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";

// FilterBar only carries a search box and dropdowns. Both lead lists also filter on a date
// range, so the two date inputs are added here rather than in the shared bar.
export function LeadFilters({
  searchPlaceholder,
  filters,
  fromLabel,
  toLabel,
}: {
  searchPlaceholder: string;
  filters: Filter[];
  fromLabel: string;
  toLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next}`);
  };

  const clearDates = () => {
    const next = new URLSearchParams(params);
    next.delete("from");
    next.delete("to");
    next.delete("page");
    router.replace(`${pathname}?${next}`);
  };

  return (
    <div className="space-y-3">
      <FilterBar searchPlaceholder={searchPlaceholder} filters={filters} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lead-from" className="text-xs text-muted-foreground">
            {fromLabel}
          </Label>
          <Input
            id="lead-from"
            type="date"
            className="w-44"
            value={from}
            onChange={(event) => set("from", event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-to" className="text-xs text-muted-foreground">
            {toLabel}
          </Label>
          <Input
            id="lead-to"
            type="date"
            className="w-44"
            value={to}
            onChange={(event) => set("to", event.target.value)}
          />
        </div>

        {from || to ? (
          <Button variant="ghost" size="sm" onClick={clearDates}>
            <X />
            Clear dates
          </Button>
        ) : null}
      </div>
    </div>
  );
}
