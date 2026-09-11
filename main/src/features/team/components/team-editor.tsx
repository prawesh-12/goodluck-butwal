"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTeamMember, deleteTeamMember, updateTeamMember } from "@/features/team/actions";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import {
  ChipField,
  FieldShell,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
  type OfficeOption,
} from "@/components/shared/admin/fields";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { Button } from "@/components/ui/admin/button";

export type TeamValues = {
  id: string;
  officeId: string;
  slug: string;
  fullName: string;
  position: string;
  photoId: string;
  bioHtml: string;
  qualifications: string[];
  expertise: string[];
  email: string;
  phone: string;
  linkedinUrl: string;
  isCoFounder: boolean;
  isFeatured: boolean;
  status: string;
};

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function TeamEditor({
  values,
  photo,
  offices,
  canPublish,
  canDelete,
}: {
  values: TeamValues;
  photo: PickedMedia | null;
  offices: OfficeOption[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [form, setForm] = useState(values);
  const [dirty, setDirty] = useState(false);
  const isNew = values.id === "";

  const set = <K extends keyof TeamValues>(key: K, value: TeamValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  useEffect(() => focusFirstError(errors), [errors]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      officeId: form.officeId,
      slug: form.slug,
      fullName: form.fullName,
      position: form.position,
      photoId: form.photoId,
      bioHtml: form.bioHtml,
      qualifications: form.qualifications,
      expertise: form.expertise,
      email: form.email,
      phone: form.phone,
      linkedinUrl: form.linkedinUrl,
      isCoFounder: form.isCoFounder,
      isFeatured: form.isFeatured,
      status: canPublish ? form.status : values.status || "draft",
    };

    const saved = await run(
      () => (isNew ? createTeamMember(payload) : updateTeamMember({ ...payload, id: values.id })),
      {
        success: isNew ? "Team member added" : "Team member saved",
        failure: isNew ? "Couldn't add this team member." : "Couldn't save this team member.",
      },
    );
    if (!saved) return;

    setDirty(false);
    if (isNew) router.push(`/admin/team/${saved.id}`);
    else router.refresh();
  };

  const remove = async () => {
    const done = await run(() => deleteTeamMember({ id: values.id }), {
      success: "Team member deleted",
      failure: "Couldn't delete this team member.",
    });
    if (!done) return;
    setDirty(false);
    router.push("/admin/team");
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <UnsavedGuard dirty={dirty} />

      <EditorLayout
        aside={
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
                    Your role can save this person but not publish them.
                  </p>
                </div>
              </FieldShell>
            )}

            <SwitchField
              label="Co-founder"
              help="Shown on the message from the co-founders page."
              checked={form.isCoFounder}
              onChange={(checked) => set("isCoFounder", checked)}
            />
            <SwitchField
              label="Featured"
              help="Featured people are shown first on the team page."
              checked={form.isFeatured}
              onChange={(checked) => set("isFeatured", checked)}
            />
          </SectionCard>
        }
      >
        <SectionCard title="Profile">
          <TextField
            name="fullName"
            label="Full name"
            value={form.fullName}
            required
            onChange={(value) => set("fullName", value)}
            error={errors.fullName?.[0]}
          />
          <TextField
            name="position"
            label="Position"
            value={form.position}
            onChange={(value) => set("position", value)}
            placeholder="Migration Agent"
            error={errors.position?.[0]}
          />
          <SelectField
            name="officeId"
            label="Office"
            value={form.officeId}
            onChange={(value) => set("officeId", value)}
            emptyLabel="No office"
            options={offices.map((office) => ({ value: office.id, label: office.name }))}
            error={errors.officeId?.[0]}
          />
          <MediaPicker
            label="Photo"
            name="photoId"
            value={photo}
            type="image"
            onChange={(id) => set("photoId", id ?? "")}
          />
          <TextField
            name="slug"
            label="URL slug"
            help="Leave it empty and the address is made from the name."
            value={form.slug}
            onChange={(value) => set("slug", value)}
            error={errors.slug?.[0]}
          />
        </SectionCard>

        <SectionCard title="About">
          <TextAreaField
            name="bioHtml"
            label="Biography"
            rows={8}
            value={form.bioHtml}
            onChange={(value) => set("bioHtml", value)}
            error={errors.bioHtml?.[0]}
          />
          <ChipField
            name="qualifications"
            label="Qualifications"
            placeholder="MARA 1234567"
            values={form.qualifications}
            onChange={(next) => set("qualifications", next)}
          />
          <ChipField
            name="expertise"
            label="Areas of expertise"
            placeholder="Student visas"
            values={form.expertise}
            onChange={(next) => set("expertise", next)}
          />
        </SectionCard>

        <SectionCard title="Links" description="Shown on this person's own page.">
          <TextField
            name="email"
            label="Email address"
            type="email"
            value={form.email}
            onChange={(value) => set("email", value)}
            error={errors.email?.[0]}
          />
          <TextField
            name="phone"
            label="Phone number"
            value={form.phone}
            onChange={(value) => set("phone", value)}
            placeholder="+61390000000"
            error={errors.phone?.[0]}
          />
          <TextField
            name="linkedinUrl"
            label="LinkedIn"
            value={form.linkedinUrl}
            onChange={(value) => set("linkedinUrl", value)}
            placeholder="https://www.linkedin.com/in/"
            error={errors.linkedinUrl?.[0]}
          />
        </SectionCard>
      </EditorLayout>

      <EditorActionBar
        dirty={dirty}
        busy={busy}
        saveLabel={isNew ? "Add team member" : "Save"}
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
              title={`Remove ${values.fullName} from the team?`}
              description="They will no longer appear on the website. This cannot be undone."
              confirmLabel="Delete team member"
              onConfirm={remove}
            />
          ) : null
        }
      />
    </form>
  );
}
