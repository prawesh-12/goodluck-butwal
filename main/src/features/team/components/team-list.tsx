"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reorderTeam } from "@/features/team/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { Button } from "@/components/ui/admin/button";
import { EditLink, FlatBadge, RowAvatar, StatusBadge, ViewSiteLink } from "@/components/shared/admin/list-ui";
import { cn } from "@/components/ui/admin/cn";

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Office</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.map((row) => (
            <TableRow
              key={row.id}
              draggable={canReorder}
              onDragStart={() => setDragging(row.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(row.id)}
              onDragEnd={() => setDragging(null)}
              className={cn(dragging === row.id && "opacity-50", canReorder && "cursor-grab")}
            >
              <TableCell>
                <span className="flex items-center gap-2.5">
                  <RowAvatar name={row.fullName} />
                  <span className="font-medium">{row.fullName}</span>
                </span>
              </TableCell>
              <TableCell>{row.position ?? "Not set"}</TableCell>
              <TableCell>
                <FlatBadge>{row.office ?? "No office"}</FlatBadge>
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                <span className="flex items-center justify-end gap-1">
                  <ViewSiteLink href="/about/team" />
                  <EditLink href={`/admin/team/${row.id}`} />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {canReorder ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Drag a row to change the order people appear in on the team page.
          </span>
          {moved ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
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
            </Button>
          ) : null}
          {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
        </div>
      ) : null}
    </>
  );
}
