import { and, count, eq, gte, inArray } from "drizzle-orm";
import { db } from "@db/client";
import { consultations, enquiries, events, posts, testPrepBatches } from "@db/schema";
import { requireActor } from "@/lib/session";
import { can, scopedWhere, type Actor } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function startOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function tiles(actor: Actor) {
  const out: { label: string; value: number; href: string }[] = [];

  if (can(actor, "enquiries", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(enquiries)
      .where(and(eq(enquiries.status, "new"), scopedWhere(enquiries, actor)));
    out.push({ label: "New enquiries", value: row.n, href: "/admin/enquiries" });
  }

  if (can(actor, "consultations", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(consultations)
      .where(and(eq(consultations.status, "pending"), scopedWhere(consultations, actor)));
    out.push({ label: "Pending consultations", value: row.n, href: "/admin/consultations" });
  }

  if (can(actor, "posts", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(posts)
      .where(and(inArray(posts.status, ["draft", "scheduled"]), scopedWhere(posts, actor)));
    out.push({ label: "Drafts", value: row.n, href: "/admin/posts" });
  }

  if (can(actor, "events", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(events)
      .where(and(gte(events.startsAt, new Date()), scopedWhere(events, actor)));
    out.push({ label: "Upcoming events", value: row.n, href: "/admin/events" });
  }

  if (can(actor, "batches", "read")) {
    const [row] = await db
      .select({ n: count() })
      .from(testPrepBatches)
      .where(gte(testPrepBatches.startDate, startOfMonth().toISOString().slice(0, 10)));
    out.push({ label: "Batches this month", value: row.n, href: "/admin/test-prep" });
  }

  return out;
}

export default async function Dashboard() {
  const actor = await requireActor();
  const cards = await tiles(actor);

  return (
    <>
      <h1 className="t-h4">Dashboard</h1>
      <div className="admin-tiles">
        {cards.map((card) => (
          <a key={card.label} href={card.href} className="admin-tile">
            <span className="t-stat">{card.value}</span>
            <span className="t-small">{card.label}</span>
          </a>
        ))}
      </div>
    </>
  );
}
