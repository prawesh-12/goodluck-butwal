import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@db/client";
import { consultations, enquiries, events, posts, testPrepBatches } from "@db/schema";
import { requireActor } from "@/lib/auth/session";
import { can, scopedWhere, type Actor } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/admin/card";

export const dynamic = "force-dynamic";

function startOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function tiles(actor: Actor) {
  const out: { label: string; value: number; href: string; hint: string }[] = [];

  if (can(actor, "enquiries", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(enquiries)
      .where(and(eq(enquiries.status, "new"), scopedWhere(enquiries, actor)));
    out.push({ label: "New enquiries", value: row.n, href: "/admin/enquiries", hint: "Need a first reply" });
  }

  if (can(actor, "consultations", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(consultations)
      .where(and(eq(consultations.status, "pending"), scopedWhere(consultations, actor)));
    out.push({ label: "Pending consultations", value: row.n, href: "/admin/consultations", hint: "Awaiting confirmation" });
  }

  if (can(actor, "posts", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(posts)
      .where(and(eq(posts.status, "draft"), scopedWhere(posts, actor)));
    out.push({ label: "Drafts", value: row.n, href: "/admin/posts", hint: "Not yet published" });
  }

  if (can(actor, "events", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(events)
      .where(and(gte(events.startsAt, new Date()), scopedWhere(events, actor)));
    out.push({ label: "Upcoming events", value: row.n, href: "/admin/events", hint: "On the calendar" });
  }

  if (can(actor, "batches", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(testPrepBatches)
      .where(gte(testPrepBatches.startDate, startOfMonth().toISOString().slice(0, 10)));
    out.push({ label: "Batches this month", value: row.n, href: "/admin/test-prep", hint: "Starting soon" });
  }

  return out;
}

export default async function Dashboard() {
  const actor = await requireActor();
  const cards = await tiles(actor);

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Today&apos;s workload across the areas you can access.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <a key={card.label} href={card.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </>
  );
}
