"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Search, Trash2, Video } from "lucide-react";
import { mediaUrl } from "@/lib/utils/media-url";
import { Button } from "@/components/ui/admin/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/admin/dialog";
import { Input } from "@/components/ui/admin/input";
import { FieldLabel } from "@/components/shared/admin/fields";
import { Skeleton } from "@/components/ui/admin/skeleton";

export type PickedMedia = {
  id: string;
  kind: "static" | "cloudinary";
  staticPath: string | null;
  cloudinaryPublicId: string | null;
  filename: string | null;
  altText: string | null;
};

function Thumb({
  item,
  type,
  className,
  width = 320,
}: {
  item: PickedMedia;
  type?: "image" | "video";
  className: string;
  width?: number;
}) {
  if (type === "video") return <video src={mediaUrl(item, width)} className={className} muted playsInline />;
  return <img src={mediaUrl(item, width)} alt={item.altText ?? ""} className={className} />;
}

// The only way to choose an image in the admin. No form has a file input, so every image is a
// library item with alt text attached.
export function MediaPicker({
  label,
  name,
  value,
  help,
  type,
  required,
  onChange,
}: {
  label: string;
  name: string;
  value?: PickedMedia | null;
  help?: string;
  type?: "image" | "video";
  required?: boolean;
  onChange?: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedMedia | null>(value ?? null);
  const [items, setItems] = useState<PickedMedia[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Waits for a pause in typing, and ignores a reply that lands after the dialog closed.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/media/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ""}`);
      const body = (await res.json()) as { ok: boolean; data?: PickedMedia[] };
      if (cancelled) return;
      setItems(body.data ?? []);
      setLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, q, type]);

  const choose = (item: PickedMedia | null) => {
    setPicked(item);
    setOpen(false);
    onChange?.(item?.id ?? null);
  };

  const Placeholder = type === "video" ? Video : ImageIcon;

  return (
    <div data-field={name} className="space-y-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input type="hidden" name={name} value={picked?.id ?? ""} readOnly />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {picked ? (
          <div className="flex justify-center border-b border-border bg-secondary p-3">
            <Thumb item={picked} type={type} width={960} className="max-h-64 w-auto rounded object-contain" />
          </div>
        ) : null}

        <div className="flex items-center gap-3 p-3">
          {picked ? null : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <Placeholder className="size-5" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            {picked ? (
              <>
                {/* What the picture shows is what the user recognises. The file name is a detail. */}
                <p className="truncate text-sm font-medium">{picked.altText || picked.filename}</p>
                {picked.altText ? (
                  <p className="truncate text-xs text-muted-foreground">{picked.filename}</p>
                ) : type === "video" ? null : (
                  <p className="text-xs font-medium text-destructive">This image has no description yet.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing chosen.</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              {picked ? "Replace" : type === "video" ? "Choose video" : "Choose image"}
            </Button>
            {picked ? (
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => choose(null)} title="Remove">
                <Trash2 />
                <span className="sr-only">Remove</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] gap-4 overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose {label.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Everything already in the {type === "video" ? "video" : "image"} library.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              className="pl-9"
              placeholder="Search by name or description"
              onChange={(event) => setQ(event.target.value)}
            />
          </div>

          <div className="-mx-1 max-h-[50vh] overflow-y-auto px-1">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="aspect-4/3 w-full rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nothing matches. Upload it in {type === "video" ? "Videos" : "Images"} first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => choose(item)}
                    className="group space-y-1.5 rounded-lg border border-border p-1.5 text-left transition-colors hover:border-ring hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Thumb item={item} type={type} className="aspect-4/3 w-full rounded-md bg-secondary object-contain" />
                    <span className="block truncate px-0.5 text-xs font-medium">{item.filename}</span>
                    {type === "video" || item.altText ? null : (
                      <span className="block px-0.5 text-xs text-destructive">No description</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
