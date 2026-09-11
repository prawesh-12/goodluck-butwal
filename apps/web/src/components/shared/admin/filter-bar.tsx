"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/admin/badge";
import { Button } from "@/components/ui/admin/button";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/admin/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/admin/sheet";

export type Filter = {
  name: string;
  label: string;
  anyLabel?: string;
  options: { value: string; label: string }[];
};

const ANY = "__any__";

function FilterSelect({
  filter,
  value,
  onChange,
}: {
  filter: Filter;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{filter.label}</Label>
      <Select
        value={value === "" ? ANY : value}
        onValueChange={(next) => onChange(!next || next === ANY ? "" : next)}
        items={[{ value: ANY, label: filter.anyLabel ?? `All ${filter.label.toLowerCase()}` }, ...filter.options]}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{filter.anyLabel ?? `All ${filter.label.toLowerCase()}`}</SelectItem>
          {filter.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Search waits for a pause in typing, so a long name is one query rather than twelve.
export function FilterBar({
  searchPlaceholder = "Search...",
  filters = [],
}: {
  searchPlaceholder?: string;
  filters?: Filter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const active = filters.filter((filter) => params.get(filter.name));
  const anything = active.length > 0 || Boolean(params.get("q"));

  const clear = () => {
    setQ("");
    router.replace(pathname);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            aria-label="Search"
            placeholder={searchPlaceholder}
            className="pl-9"
            onChange={(event) => setQ(event.target.value)}
          />
        </div>

        {filters.length > 0 ? (
          <>
            <div className="hidden items-end gap-2 lg:flex">
              {filters.map((filter) => (
                <div key={filter.name} className="w-44">
                  <FilterSelect
                    filter={filter}
                    value={params.get(filter.name) ?? ""}
                    onChange={(value) => set(filter.name, value)}
                  />
                </div>
              ))}
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}>
                  <SlidersHorizontal />
                  Filters
                  {active.length > 0 ? <Badge variant="secondary">{active.length}</Badge> : null}
                </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 px-4 pb-6">
                  {filters.map((filter) => (
                    <FilterSelect
                      key={filter.name}
                      filter={filter}
                      value={params.get(filter.name) ?? ""}
                      onChange={(value) => set(filter.name, value)}
                    />
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setSheetOpen(false)}>
                    Show results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : null}

        {anything ? (
          <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">
            <X />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
