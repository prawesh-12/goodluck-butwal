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
import { reorderTeam } from "@/features/team/actions";
import { cn } from "@/components/ui/admin/cn";

export type TeamRow = {
  id: string;
  slug: string;
  fullName: string;
  position: string | null;
  office: string | null;
  status: string;
};

export function TeamList({
  rows,
  offset,
  canReorder,
}: {
  rows: TeamRow[];
  offset: number;
  canReorder: boolean;
}) {
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
    const saved = await run(() => reorderTeam({ ids: order.map((row) => row.id) }), {
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
                <span className="sr-only">Photo</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="hidden md:table-cell">Office</TableHead>
              <TableHead className="hidden md:table-cell">Display order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.map((row, index) => (
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
                  <RowAvatar name={row.fullName} />
                </TableCell>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell>{row.position ?? <Muted>Not set</Muted>}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <FlatBadge>{row.office ?? "No office"}</FlatBadge>
                </TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">{offset + index + 1}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">
                    {row.status === "published" ? <ViewSiteLink href={`/team/${row.slug}`} /> : null}
                    <EditLink href={`/admin/team/${row.id}`} />
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
            Drag a row to change the order people appear in on the team page.
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
