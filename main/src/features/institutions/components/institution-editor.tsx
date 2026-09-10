"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/admin/alert";
import { Button } from "@/components/ui/admin/button";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { EditorActionBar, EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { SelectField, SwitchField, TextField } from "@/components/shared/admin/fields";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import { MediaPicker, type PickedMedia } from "@/features/media/components/media-picker";
import { institutionPath } from "@/config/course-meta";
import { createInstitution, deleteInstitution, updateInstitution } from "@/features/institutions/actions";

const RichText = dynamic(() => import("@/components/shared/admin/editor-rich-text"), { ssr: false });

export type InstitutionValue = {
  id?: string;
  slug: string;
  name: string;
  logoId: string | null;
  destinationId: string | null;
  country: string;
  city: string;
  websiteUrl: string;
  descriptionHtml: string;
  isPartner: boolean;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
};

export function InstitutionEditor({
  value,
  media,
  destinations,
  courses,
  canDelete,
  canPublish,
}: {
  value: InstitutionValue;
  media: Record<string, PickedMedia>;
  destinations: { id: string; name: string }[];
  courses?: number;
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [form, setForm] = useState<InstitutionValue>(value);
  const [dirty, setDirty] = useState(false);
  const [askPublish, setAskPublish] = useState(false);

  useEffect(() => {
    focusFirstError(errors);
  }, [errors]);

  const set = <K extends keyof InstitutionValue>(key: K, next: InstitutionValue[K]) => {
    setForm((current) => ({ ...current, [key]: next }));
    setDirty(true);
  };

  const path = institutionPath(form.slug);
  const goingLive = form.status === "published" && value.status !== "published";
  const publishProblems = errors.publish ?? [];

  const save = async () => {
    const id = form.id;
    const saved = await run(() => (id ? updateInstitution({ ...form, id }) : createInstitution(form)), {
      success: id ? "Institution saved" : "Institution created",
      failure: id ? "Couldn't save the institution." : "Couldn't create the institution.",
    });
    if (!saved) return;
    setDirty(false);
    if (id) router.refresh();
    else router.push(`/admin/institutions/${saved.id}`);
  };

  const remove = async () => {
    const id = form.id;
    if (!id) return;
    const gone = await run(() => deleteInstitution({ id }), {
      success: "Institution deleted",
      failure: "Couldn't delete the institution.",
    });
    if (!gone) return;
    setDirty(false);
    router.push("/admin/institutions");
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (goingLive) setAskPublish(true);
        else void save();
      }}
    >
      <UnsavedGuard dirty={dirty} />

      <EditorLayout
        aside={
          <SectionCard title="Publishing">
            <SelectField
              name="status"
              label="Status"
              value={form.status}
              onChange={(status) => set("status", status)}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published", disabled: !canPublish },
                { value: "archived", label: "Archived" },
              ]}
            />

            {publishProblems.length > 0 ? (
              <Alert variant="destructive">
                <AlertTitle>This cannot go live yet</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {publishProblems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            {value.id ? (
              <div className="space-y-3">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={path} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    View on site
                  </a>
                </Button>
                {courses !== undefined ? (
                  <p className="text-xs text-muted-foreground">
                    {courses === 0 ? (
                      "No courses here yet."
                    ) : (
                      <>
                        <Link
                          href={`/admin/courses?institution=${value.id}`}
                          className="underline underline-offset-2"
                        >
                          {courses} {courses === 1 ? "course" : "courses"}
                        </Link>{" "}
                        {courses === 1 ? "runs" : "run"} here. Move {courses === 1 ? "it" : "them"}{" "}
                        before deleting this institution.
                      </>
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}
          </SectionCard>
        }
      >
        <SectionCard title="Basic information">
          <TextField
            name="name"
            label="Name"
            value={form.name}
            onChange={(name) => set("name", name)}
            error={errors.name?.[0]}
          />
          <TextField
            name="slug"
            label="URL slug"
            help="Used in the page address."
            value={form.slug}
            onChange={(slug) => set("slug", slug)}
            error={errors.slug?.[0]}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="destinationId"
              label="Destination"
              emptyLabel="Not set"
              value={form.destinationId ?? ""}
              onChange={(id) => set("destinationId", id || null)}
              options={destinations.map((destination) => ({ value: destination.id, label: destination.name }))}
            />
            <TextField
              name="country"
              label="Country"
              value={form.country}
              onChange={(country) => set("country", country)}
              error={errors.country?.[0]}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="city"
              label="City"
              value={form.city}
              onChange={(city) => set("city", city)}
              error={errors.city?.[0]}
            />
            <TextField
              name="websiteUrl"
              label="Website"
              placeholder="https://"
              value={form.websiteUrl}
              onChange={(websiteUrl) => set("websiteUrl", websiteUrl)}
              error={errors.websiteUrl?.[0]}
            />
          </div>
        </SectionCard>

        <SectionCard title="Institution profile">
          <RichText
            label="Description"
            value={form.descriptionHtml}
            onChange={(descriptionHtml: string) => set("descriptionHtml", descriptionHtml)}
          />
        </SectionCard>

        <SectionCard title="Media">
          <MediaPicker
            label="Logo"
            name="logoId"
            value={form.logoId ? (media[form.logoId] ?? null) : null}
            onChange={(logoId) => set("logoId", logoId)}
          />
        </SectionCard>

        <SectionCard title="Features">
          <SwitchField
            label="Partner institution"
            help="Shown as one Goodluck works with directly."
            checked={form.isPartner}
            onChange={(isPartner) => set("isPartner", isPartner)}
          />
          <SwitchField
            label="Featured"
            help="Pulled to the front of the institutions page."
            checked={form.isFeatured}
            onChange={(isFeatured) => set("isFeatured", isFeatured)}
          />
          <TextField
            name="sortOrder"
            label="Display order"
            type="number"
            help="Lower numbers appear first."
            value={String(form.sortOrder)}
            onChange={(sortOrder) => set("sortOrder", Number(sortOrder) || 0)}
            className="sm:max-w-40"
          />
        </SectionCard>
      </EditorLayout>

      <EditorActionBar
        dirty={dirty}
        busy={busy}
        saveLabel={form.id ? "Save" : "Create institution"}
        destructive={
          canDelete && form.id ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 />
                  Delete
                </Button>
              }
              title="Delete this institution?"
              description="This cannot be undone."
              confirmLabel="Delete institution"
              onConfirm={remove}
            />
          ) : null
        }
      />

      <ConfirmDialog
        open={askPublish}
        onOpenChange={setAskPublish}
        title="Publish this institution?"
        description="It will become visible on the public website."
        confirmLabel="Publish"
        destructive={false}
        onConfirm={save}
      />
    </form>
  );
}
