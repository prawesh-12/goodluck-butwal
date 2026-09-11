import { PageSkeleton } from "@/components/shared/admin/states";

// Every admin page is force-dynamic, so a navigation waits on the database. This covers the
// whole section; a page with a distinctive shape can add its own loading.tsx beside it.
export default function Loading() {
  return <PageSkeleton />;
}
