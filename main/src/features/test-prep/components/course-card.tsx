import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { can, type Actor } from "@/lib/auth/rbac";
import { EditLink, FlatBadge, StatusBadge } from "@/components/shared/admin/list-ui";
import { ViewOnSiteButton } from "@/components/shared/admin/page-header";
import { TEST_LABEL } from "@/features/test-prep/schedule";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent } from "@/components/ui/admin/card";

export type CourseCardRow = {
  id: string;
  slug: string;
  name: string;
  testType: string;
  status: string;
  fee: string | null;
  feeCurrency: string;
};

export function batchCount(n: number) {
  if (n === 0) return "No batches yet";
  return n === 1 ? "1 batch" : `${n} batches`;
}

export function CourseCard({ course, batches, actor }: { course: CourseCardRow; batches: number; actor: Actor }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium text-foreground">{course.name}</h2>
            <FlatBadge variant="outline">{TEST_LABEL[course.testType]}</FlatBadge>
            <StatusBadge status={course.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {batchCount(batches)}
            {course.fee ? ` · ${course.feeCurrency} ${course.fee}` : " · Fee not set"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {batches === 0 ? (
            can(actor, "batches", "create") ? (
              <Button size="sm" asChild>
                <Link href={`/admin/test-prep/batches/new?course=${course.id}`}>
                  <CalendarDays />
                  Add a batch
                </Link>
              </Button>
            ) : null
          ) : can(actor, "batches", "read") ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/test-prep/batches?course=${course.id}`}>
                <CalendarDays />
                Manage batches
              </Link>
            </Button>
          ) : null}

          {can(actor, "registrations", "read") ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/test-prep/registrations?course=${course.id}`}>
                <Users />
                Registrations
              </Link>
            </Button>
          ) : null}

          {can(actor, "testPrep", "update") ? <EditLink href={`/admin/test-prep/${course.id}`} /> : null}

          {course.status === "published" ? (
            <ViewOnSiteButton href={`/test-preparation/${course.slug}`} variant="ghost" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
