"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { Button } from "@/components/ui/admin/button";
import {
  DataCard,
  EditLink,
  FlatBadge,
  Muted,
  RowAvatar,
  StatusBadge,
  ViewSiteLink,
} from "@/components/shared/admin/list-ui";
import { useAction } from "@/components/shared/admin/use-action";
import { reorderPartners } from "@/features/partners/actions";
import { cn } from "@/components/ui/admin/cn";

export type PartnerRow = {
  id: string;
  name: string;
  websiteUrl: string | null;
  status: string;
  isFeatured: boolean;
};

export function PartnerList({ rows, canReorder }: { rows: PartnerRow[]; canReorder: boolean }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [order, setOrder] = useState(rows);
  const [dragging, setDragging] = useState<string | null>(null);

  const moved = order.some((row, index) => row.id !== rows[index]?.id);

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

  const save = async () => {
    const saved = await run(() => reorderPartners({ ids: order.map((row) => row.id) }), {
      success: "Order saved",
      failure: "Couldn't save the order.",
    });
    if (saved) router.refresh();
  };

  return (
    <div className="space-y-3">
      <DataCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <span className="sr-only">Logo</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Website</TableHead>
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
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOn(row.id)}
                onDragEnd={() => setDragging(null)}
                className={cn(dragging === row.id && "opacity-50", canReorder && "cursor-grab")}
              >
                <TableCell>
                  <RowAvatar name={row.name} />
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="hidden max-w-56 truncate md:table-cell">
                  {row.websiteUrl ?? <Muted>Not set</Muted>}
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={row.status} />
                    {row.isFeatured ? <FlatBadge variant="default">Featured</FlatBadge> : null}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    <ViewSiteLink href="/" label="View the home page" />
                    <EditLink href={`/admin/partners/${row.id}`} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataCard>

      {canReorder ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Drag a row to change the order logos scroll past on the home page.
          </p>
          {moved ? (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={save}>
              {busy ? "Saving..." : "Save order"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
