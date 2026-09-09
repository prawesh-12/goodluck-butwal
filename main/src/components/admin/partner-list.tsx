"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reorderPartners } from "@/server/actions/partners";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { EditLink, FlatBadge, RowAvatar, StatusBadge, ViewSiteLink } from "./list-ui";
import { cn } from "./ui/cn";

export type PartnerRow = {
  id: string;
  name: string;
  websiteUrl: string | null;
  status: string;
  isFeatured: boolean;
};

export function PartnerList({ rows, canReorder }: { rows: PartnerRow[]; canReorder: boolean }) {
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
            <TableHead>Website</TableHead>
            <TableHead>Featured</TableHead>
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
                  <RowAvatar name={row.name} />
                  <span className="font-medium">{row.name}</span>
                </span>
              </TableCell>
              <TableCell className="max-w-56 truncate">{row.websiteUrl ?? "Not set"}</TableCell>
              <TableCell>
                {row.isFeatured ? <FlatBadge variant="default">Featured</FlatBadge> : <FlatBadge>No</FlatBadge>}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                <span className="flex items-center justify-end gap-1">
                  <ViewSiteLink href="/" />
                  <EditLink href={`/admin/partners/${row.id}`} />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {canReorder ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Drag a row to change the order logos scroll past on the home page.
          </span>
          {moved ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const result = await reorderPartners({ ids: order.map((row) => row.id) });
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
