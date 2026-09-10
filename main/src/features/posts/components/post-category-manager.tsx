"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Tags, Trash2 } from "lucide-react";
import {
  createPostCategory,
  deletePostCategory,
  updatePostCategory,
} from "@/features/posts/taxonomy-actions";
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
import { DataCard, Muted } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { useAction } from "@/components/shared/admin/use-action";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  posts: number;
};

type Draft = { id?: string; name: string; slug: string; description: string; sortOrder: string };

const blank: Draft = { name: "", slug: "", description: "", sortOrder: "0" };

export function PostCategoryManager({
  rows,
  canCreate,
  canEdit,
  canDelete,
}: {
  rows: CategoryRow[];
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
    const payload = {
      name: draft.name,
      slug: draft.slug,
      description: draft.description,
      sortOrder: Number(draft.sortOrder) || 0,
    };
    const saved = await run(
      () => (draft.id ? updatePostCategory({ ...payload, id: draft.id }) : createPostCategory(payload)),
      { success: "Category saved", failure: "Couldn't save the category." },
    );
    if (!saved) return;
    setDraft(null);
    router.refresh();
  };

  const remove = async (row: CategoryRow) => {
    const done = await run(() => deletePostCategory({ id: row.id }), {
      success: "Category deleted",
      failure: "Couldn't delete the category.",
    });
    if (done) router.refresh();
  };

  const newCategory = canCreate ? (
    <Button onClick={() => openDraft({ ...blank })}>New category</Button>
  ) : null;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Categories group articles on the news page.</p>
        {newCategory}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Add a category so readers can browse articles by subject."
          action={newCategory}
        />
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.name}
                    {row.description ? (
                      <span className="block text-xs font-medium text-muted-foreground">{row.description}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {row.posts > 0 ? row.posts : <Muted>None</Muted>}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-1">
                      {canEdit ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openDraft({
                              id: row.id,
                              name: row.name,
                              slug: row.slug,
                              description: row.description ?? "",
                              sortOrder: String(row.sortOrder),
                            })
                          }
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
                          title={`Delete the ${row.name} category?`}
                          description="Articles keep their text, but they lose this label on the website."
                          confirmLabel="Delete category"
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
            <DialogTitle>{draft?.id ? "Edit category" : "New category"}</DialogTitle>
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
            <TextField
              name="description"
              label="Description"
              value={draft?.description ?? ""}
              onChange={(value) => set("description", value)}
              error={errors.description?.[0]}
            />
            <TextField
              name="sortOrder"
              label="Display order"
              type="number"
              value={draft?.sortOrder ?? "0"}
              help="Lower numbers appear first."
              onChange={(value) => set("sortOrder", value)}
              error={errors.sortOrder?.[0]}
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
