"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/admin/tabs";

// The chosen tab lives in the address so the server renders the right panel and a refresh keeps
// the user where they were.
export function PostsTabs({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (next: string) => {
    const query = new URLSearchParams(params);
    if (next === "articles") query.delete("tab");
    else query.set("tab", next);
    query.delete("page");
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  };

  return (
    <Tabs value={value} onValueChange={go}>
      <TabsList>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
