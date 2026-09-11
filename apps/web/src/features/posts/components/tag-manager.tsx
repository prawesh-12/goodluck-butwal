"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Pencil, Trash2 } from "lucide-react";
import { createTag, deleteTag, updateTag } from "@/features/posts/taxonomy-actions";
import { Button } from "@/components/ui/admin/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/admin/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/admin/table";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { TextField } from "@/components/shared/admin/fields";
import { DataCard } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { useAction } from "@/components/shared/admin/use-action";

export type TagRow = { id: string; slug: string; name: string };

type Draft = { id?: string; name: string; slug: string };

export function TagManager({
  rows,
  canCreate,
  canEdit,
  canDelete,
}: {
  rows: TagRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { busy, errors, setErrors, run } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);

  const openDraft = (next: Draft) => {
    setErrors({});
    setDraft(next);
  };

  const set = (key: keyof Draft, value: string) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    if (!draft) return;
    const payload = { name: draft.name, slug: draft.slug };
    const saved = await run(() => (draft.id ? updateTag({ ...payload, id: draft.id }) : createTag(payload)), {
      success: "Tag saved",
      failure: "Couldn't save the tag.",
    });
    if (!saved) return;
    setDraft(null);
    router.refresh();
  };

  const remove = async (row: TagRow) => {
    const done = await run(() => deleteTag({ id: row.id }), {
      success: "Tag deleted",
      failure: "Couldn't delete the tag.",
    });
    if (done) router.refresh();
  };

  const newTag = canCreate ? <Button onClick={() => openDraft({ name: "", slug: "" })}>New tag</Button> : null;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Tags sit at the foot of an article and gather related ones.</p>
        {newTag}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Hash}
          title="No tags yet"
          description="Add a tag to link articles on the same subject."
          action={newTag}
        />
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-1">
                      {canEdit ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDraft({ id: row.id, name: row.name, slug: row.slug })}
                        >
                          <Pencil />
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm" className="text-destructive">
                              <Trash2 />
                              <span className="sr-only">Delete {row.name}</span>
                            </Button>
                          }
                          title={`Delete the ${row.name} tag?`}
                          description="It comes off every article using it."
                          confirmLabel="Delete tag"
                          onConfirm={() => remove(row)}
                        />
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : setDraft(null))}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit tag" : "New tag"}</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <TextField
              name="name"
              label="Name"
              required
              value={draft?.name ?? ""}
              onChange={(value) => set("name", value)}
              error={errors.name?.[0]}
            />
            <TextField
              name="slug"
              label="URL slug"
              value={draft?.slug ?? ""}
              help="Used in the page address."
              onChange={(value) => set("slug", value)}
              error={errors.slug?.[0]}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
