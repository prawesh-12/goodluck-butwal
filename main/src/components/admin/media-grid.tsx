"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { describeMedia, deleteMedia } from "@/server/actions/media";
import { Select } from "./repeater";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { EmptyState, FilterCard, SearchField, FlatBadge } from "./list-ui";

type Row = {
  id: string;
  kind: "static" | "cloudinary";
  type: string;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  filename: string | null;
  altText: string | null;
  caption: string | null;
  folder: string;
};

// Static rows keep the path they always had. Cloudinary rows get the transform the plan sets.
function src(row: Row, width = 320) {
  if (row.kind === "static") return row.staticPath ?? "";
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/${row.cloudinaryPublicId}`;
}

export function MediaGrid({
  rows,
  folders,
  total,
  missingAlt,
  page,
  pages,
  canDelete,
  canUpload,
}: {
  rows: Row[];
  folders: string[];
  total: number;
  missingAlt: number;
  page: number;
  pages: number;
  canDelete: boolean;
  canUpload: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`/admin/media?${next}`);
  };

  const onlyMissing = params.get("missing_alt") === "1";

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        <FilterCard>
          <SearchField
            id="media-search"
            defaultValue={params.get("q") ?? ""}
            placeholder="Filename or alt text"
            onChange={(value) => set("q", value)}
          />
          <Select
            label="Folder"
            defaultValue={params.get("folder") ?? ""}
            onChange={(value) => set("folder", value)}
            options={[{ value: "", label: "All" }, ...folders.map((f) => ({ value: f, label: f }))]}
          />
          <Select
            label="Type"
            defaultValue={params.get("type") ?? ""}
            onChange={(value) => set("type", value)}
            options={[
              { value: "", label: "All" },
              { value: "image", label: "Image" },
              { value: "video", label: "Video" },
            ]}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant={onlyMissing ? "default" : "outline"}
              size="sm"
              onClick={() => set("missing_alt", onlyMissing ? "" : "1")}
            >
              {onlyMissing ? "Show all" : `Needs alt text (${missingAlt})`}
            </Button>
          </div>
        </FilterCard>
      </form>

      <p className="text-sm text-muted-foreground">
        {total} files. {missingAlt === 0 ? "Every image has alt text." : `${missingAlt} images still need alt text.`}
      </p>
      {canUpload ? null : <p className="text-sm text-muted-foreground">Your role cannot upload.</p>}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState>No files match. Clear the filters, or upload one.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <Card key={row.id} className="overflow-hidden">
              {row.type === "video" ? (
                <video src={src(row)} className="aspect-4/3 w-full bg-secondary object-contain" muted />
              ) : (
                <img src={src(row)} alt={row.altText ?? ""} className="aspect-4/3 w-full bg-secondary object-contain" loading="lazy" />
              )}
              <CardContent className="space-y-2 pt-4">
                <p className="truncate text-sm text-muted-foreground">{row.filename}</p>
                {row.type === "image" && !row.altText ? (
                  <FlatBadge variant="destructive">Needs alt text</FlatBadge>
                ) : null}
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(open === row.id ? null : row.id)}>
                    {open === row.id ? "Close" : "Edit"}
                  </Button>
                </div>

                {open === row.id ? (
                  <form
                    className="space-y-3"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const result = await describeMedia({
                        id: row.id,
                        altText: form.get("altText"),
                        caption: form.get("caption"),
                      });
                      setMessage(result.ok ? "Saved." : result.error);
                      if (result.ok) router.refresh();
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`alt-${row.id}`}>Alt text</Label>
                      <Input id={`alt-${row.id}`} name="altText" defaultValue={row.altText ?? ""} placeholder="What the image shows" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`caption-${row.id}`}>Caption</Label>
                      <Input id={`caption-${row.id}`} name="caption" defaultValue={row.caption ?? ""} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            const result = await deleteMedia({ id: row.id });
                            setMessage(result.ok ? "Deleted." : result.error);
                            if (result.ok) router.refresh();
                          }}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <p className="text-sm text-muted-foreground">Page {page} of {pages}</p>
      ) : null}
    </>
  );
}
