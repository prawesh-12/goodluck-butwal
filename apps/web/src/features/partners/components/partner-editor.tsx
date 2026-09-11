"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPartner, deletePartner, updatePartner } from "@/features/partners/actions";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { EditorActionBar, SectionCard } from "@/components/shared/admin/editor-shell";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import { FieldShell, SelectField, SwitchField, TextField } from "@/components/shared/admin/fields";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { Button } from "@/components/ui/admin/button";

export type PartnerValues = {
  id: string;
  name: string;
  logoId: string;
  websiteUrl: string;
  isFeatured: boolean;
  status: string;
};

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function PartnerEditor({
  values,
  logo,
  canPublish,
  canDelete,
}: {
  values: PartnerValues;
  logo: PickedMedia | null;
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [form, setForm] = useState(values);
  const [dirty, setDirty] = useState(false);
  const isNew = values.id === "";

  const set = <K extends keyof PartnerValues>(key: K, value: PartnerValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  useEffect(() => focusFirstError(errors), [errors]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      logoId: form.logoId,
      websiteUrl: form.websiteUrl,
      isFeatured: form.isFeatured,
      status: canPublish ? form.status : values.status || "draft",
    };

    const saved = await run(
      () => (isNew ? createPartner(payload) : updatePartner({ ...payload, id: values.id })),
      {
        success: isNew ? "Partner added" : "Partner saved",
        failure: isNew ? "Couldn't add this partner." : "Couldn't save this partner.",
      },
    );
    if (!saved) return;

    setDirty(false);
    if (isNew) router.push(`/admin/partners/${saved.id}`);
    else router.refresh();
  };

  const remove = async () => {
    const done = await run(() => deletePartner({ id: values.id }), {
      success: "Partner deleted",
      failure: "Couldn't delete this partner.",
    });
    if (!done) return;
    setDirty(false);
    router.push("/admin/partners");
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <UnsavedGuard dirty={dirty} />

      <div className="w-full max-w-2xl space-y-6">
        <SectionCard title="Partner">
          <TextField
            name="name"
            label="Partner name"
            required
            value={form.name}
            onChange={(value) => set("name", value)}
            error={errors.name?.[0]}
          />
          <TextField
            name="websiteUrl"
            label="Website"
            help="Where the logo links to."
            value={form.websiteUrl}
            onChange={(value) => set("websiteUrl", value)}
            placeholder="https://"
            error={errors.websiteUrl?.[0]}
          />
          <MediaPicker
            label="Logo"
            name="logoId"
            value={logo}
            type="image"
            onChange={(id) => set("logoId", id ?? "")}
          />
        </SectionCard>

        <SectionCard title="Visibility">
          {canPublish ? (
            <SelectField
              name="status"
              label="Status"
              value={form.status || "draft"}
              onChange={(value) => set("status", value)}
              options={STATUSES}
              error={errors.status?.[0]}
            />
          ) : (
            <FieldShell label="Status">
              <div className="space-y-2">
                <StatusBadge status={form.status || "draft"} />
                <p className="text-xs text-muted-foreground">
                  Your role can save this partner but not publish it.
                </p>
              </div>
            </FieldShell>
          )}

          <SwitchField
            label="Featured"
            help="Featured partners are shown first."
            checked={form.isFeatured}
            onChange={(checked) => set("isFeatured", checked)}
          />
        </SectionCard>
      </div>

      <EditorActionBar
        dirty={dirty}
        busy={busy}
        saveLabel={isNew ? "Add partner" : "Save"}
        destructive={
          !isNew && canDelete ? (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete
                </Button>
              }
              title={`Remove ${values.name} from the partner list?`}
              description="The logo will no longer appear on the website. This cannot be undone."
              confirmLabel="Delete partner"
              onConfirm={remove}
            />
          ) : null
        }
      />
    </form>
  );
}
