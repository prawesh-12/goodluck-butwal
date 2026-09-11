import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/admin/tabs";

export type TestPrepTab = "courses" | "batches" | "registrations";

const TABS: { value: TestPrepTab; label: string; href: string }[] = [
  { value: "courses", label: "Courses", href: "/admin/test-prep" },
  { value: "batches", label: "Batches", href: "/admin/test-prep/batches" },
  { value: "registrations", label: "Registrations", href: "/admin/test-prep/registrations" },
];

// Each tab is its own page, so the address bar already remembers which one you were on.
export function TestPrepTabs({ active, children }: { active: TestPrepTab; children: React.ReactNode }) {
  return (
    <Tabs value={active} className="gap-6">
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={active}>{children}</TabsContent>
    </Tabs>
  );
}
