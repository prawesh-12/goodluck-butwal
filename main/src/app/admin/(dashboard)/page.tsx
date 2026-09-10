import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { currentUserName, requireActor } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent } from "@/components/ui/admin/card";
import { Greeting } from "./greeting";
import { listEnquiries, listConsultations } from "@/features/leads/queries";
import { listAdminPosts } from "@/features/posts/admin-queries";
import { listAdminInstitutions } from "@/features/institutions/admin-queries";
import { listAdminCourses } from "@/features/courses/admin-queries";
import { listAdminCourses as listTestPrepCourses } from "@/features/test-prep/admin-queries";
import { listAdminEvents } from "@/features/events/admin-queries";
import { listAdminTeam } from "@/features/team/admin-queries";

export const dynamic = "force-dynamic";

type Tile = { label: string; count: number; href: string };

export default async function Dashboard() {
  const actor = await requireActor();
  const name = (await currentUserName())?.split(/\s+/)[0] ?? "";

  const [enquiries, consultations, posts, institutions, courses, testPrep, events, team] =
    await Promise.all([
      can(actor, "enquiries", "read") ? listEnquiries(actor, { status: "new" }) : null,
      can(actor, "consultations", "read") ? listConsultations(actor, { status: "pending" }) : null,
      can(actor, "posts", "read") ? listAdminPosts(actor, {}) : null,
      can(actor, "institutions", "read") ? listAdminInstitutions({}) : null,
      can(actor, "courses", "read") ? listAdminCourses({}) : null,
      can(actor, "testPrep", "read") ? listTestPrepCourses(actor, {}) : null,
      can(actor, "events", "read") ? listAdminEvents(actor, {}) : null,
      can(actor, "team", "read") ? listAdminTeam(actor, {}) : null,
    ]);

  const quickActions = [
    can(actor, "posts", "create") ? { label: "New article", href: "/admin/posts/new" } : null,
    can(actor, "events", "create") ? { label: "New event", href: "/admin/events/new" } : null,
    can(actor, "institutions", "create")
      ? { label: "Add institution", href: "/admin/institutions/new" }
      : null,
  ].filter(Boolean) as { label: string; href: string }[];

  const attention = [
    enquiries
      ? { label: "New enquiries", count: enquiries.total, href: "/admin/enquiries?status=new" }
      : null,
    consultations
      ? {
          label: "Consultation requests waiting",
          count: consultations.total,
          href: "/admin/consultations?status=pending",
        }
      : null,
  ].filter(Boolean) as Tile[];

  const overview = [
    posts ? { label: "News articles", count: posts.total, href: "/admin/posts" } : null,
    institutions
      ? { label: "Institutions", count: institutions.total, href: "/admin/institutions" }
      : null,
    courses ? { label: "Courses", count: courses.total, href: "/admin/courses" } : null,
    testPrep
      ? { label: "Test preparation courses", count: testPrep.total, href: "/admin/test-prep" }
      : null,
    events ? { label: "Events", count: events.total, href: "/admin/events" } : null,
    team ? { label: "Team members", count: team.total, href: "/admin/team" } : null,
  ].filter(Boolean) as Tile[];

  return (
    <>
      <Greeting name={name} />

      {quickActions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.href} variant="outline" asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {attention.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Needs attention</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {attention.map((tile) => (
              <Card key={tile.href} className="shadow-none transition-colors hover:border-primary/40">
                <CardContent>
                  <Link href={tile.href} className="flex items-center justify-between gap-4">
                    <span className="space-y-1">
                      <span className="block text-3xl font-semibold tracking-tight">{tile.count}</span>
                      <span className="block text-sm text-muted-foreground">{tile.label}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {overview.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Content overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overview.map((tile) => (
              <Card key={tile.href} className="shadow-none transition-colors hover:border-primary/40">
                <CardContent>
                  <Link href={tile.href} className="block space-y-1">
                    <span className="block text-2xl font-semibold tracking-tight">{tile.count}</span>
                    <span className="block text-sm text-muted-foreground">{tile.label}</span>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
