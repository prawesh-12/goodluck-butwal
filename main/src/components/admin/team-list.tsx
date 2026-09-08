"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reorderTeam } from "@/server/actions/team";

export type TeamRow = {
  id: string;
  fullName: string;
  position: string | null;
  office: string | null;
  status: string;
};

export function TeamList({ rows, canReorder }: { rows: TeamRow[]; canReorder: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState(rows);
  const [dragging, setDragging] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const moved = order.some((row, i) => row.id !== rows[i]?.id);

  const dropOn = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    setOrder((current) => {
      const next = [...current];
      const from = next.findIndex((row) => row.id === dragging);
      const to = next.findIndex((row) => row.id === targetId);
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  };

  return (
    <>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Office</th>
            <th>Status</th>
            <th>On the site</th>
          </tr>
        </thead>
        <tbody>
          {order.map((row) => (
            <tr
              key={row.id}
              draggable={canReorder}
              onDragStart={() => setDragging(row.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(row.id)}
              onDragEnd={() => setDragging(null)}
            >
              <td>
                <Link href={`/admin/team/${row.id}`}>{row.fullName}</Link>
              </td>
              <td>{row.position ?? "Not set"}</td>
              <td>{row.office ?? "No office"}</td>
              <td>{row.status}</td>
              <td>
                <a href="/about/team" target="_blank" rel="noreferrer">
                  View on site
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {canReorder ? (
        <div className="admin-actions">
          <span className="t-small admin-help">
            Drag a row to change the order people appear in on the team page.
          </span>
          {moved ? (
            <button
              type="button"
              className="admin-btn"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const result = await reorderTeam({ ids: order.map((row) => row.id) });
                setBusy(false);
                setMessage(result.ok ? "Order saved." : result.error);
                if (result.ok) router.refresh();
              }}
            >
              {busy ? "Saving" : "Save order"}
            </button>
          ) : null}
          {message ? <span className="t-small">{message}</span> : null}
        </div>
      ) : null}
    </>
  );
}
