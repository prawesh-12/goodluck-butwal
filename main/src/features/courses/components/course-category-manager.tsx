"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Tags, Trash2 } from "lucide-react";
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
import { DataCard, Muted, ViewSiteLink } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { useAction } from "@/components/shared/admin/use-action";
import {
  createCourseCategory,
  deleteCourseCategory,
  updateCourseCategory,
} from "@/features/courses/category-actions";

export type CourseCategoryRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  courses: number;
};

type Draft = { id?: string; name: string; sortOrder: number };

export function CourseCategoryManager({
  rows,
  canCreate,
  canEdit,
  canDelete,
}: {
  rows: CourseCategoryRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { busy, errors, setErrors, run } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);

  const open = (next: Draft) => {
    setErrors({});
    setDraft(next);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const id = draft.id;
    // The web address is left alone: empty keeps the stored one and makes a new one from the name.
    const payload = { name: draft.name, slug: "", sortOrder: draft.sortOrder };
    const saved = await run(() => (id ? updateCourseCategory({ ...payload, id }) : createCourseCategory(payload)), {
      success: id ? "Subject area saved" : "Subject area added",
      failure: id ? "Couldn't save the subject area." : "Couldn't add the subject area.",
    });
    if (!saved) return;
    setDraft(null);
    router.refresh();
  };

  const remove = async (row: CourseCategoryRow) => {
    const gone = await run(() => deleteCourseCategory({ id: row.id }), {
      success: "Subject area deleted",
      failure: "Couldn't delete the subject area.",
    });
    if (gone) router.refresh();
  };

  return (
    <div className="space-y-6">
      {canCreate ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => open({ name: "", sortOrder: rows.length })}>
            <Plus />
            New subject area
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No subject areas yet"
          description="Add the first one so courses can be grouped and filtered by subject."
          action={
            canCreate ? (
              <Button type="button" onClick={() => open({ name: "", sortOrder: 0 })}>
                <Plus />
                New subject area
              </Button>
            ) : null
          }
        />
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Courses</TableHead>
                <TableHead className="hidden sm:table-cell">Display order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {row.courses === 0 ? <Muted>None</Muted> : row.courses}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{row.sortOrder}</TableCell>
                  <TableCell>
                    <span className="flex items-center justify-end gap-1">
                      <ViewSiteLink href={`/courses?category=${row.slug}`} />
                      {canEdit ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => open({ id: row.id, name: row.name, sortOrder: row.sortOrder })}
                        >
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <ConfirmDialog
                          trigger={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 />
                              <span className="sr-only">Delete {row.name}</span>
                            </Button>
                          }
                          title={`Delete ${row.name}?`}
                          description="This cannot be undone."
                          confirmLabel="Delete subject area"
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

      <Dialog open={draft !== null} onOpenChange={(next) => (next ? null : setDraft(null))}>
        <DialogContent>
          <form onSubmit={save} className="space-y-5">
            <DialogHeader>
              <DialogTitle>{draft?.id ? "Edit subject area" : "New subject area"}</DialogTitle>
            </DialogHeader>

            <TextField
              name="name"
              label="Name"
              required
              value={draft?.name ?? ""}
              onChange={(name) => setDraft((current) => (current ? { ...current, name } : current))}
              error={errors.name?.[0]}
            />
            <TextField
              name="sortOrder"
              label="Display order"
              type="number"
              help="Lower numbers appear first."
              value={String(draft?.sortOrder ?? 0)}
              onChange={(sortOrder) =>
                setDraft((current) => (current ? { ...current, sortOrder: Number(sortOrder) || 0 } : current))
              }
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDraft(null)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !draft?.name.trim()}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                {busy ? "Saving..." : draft?.id ? "Save" : "Add subject area"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
