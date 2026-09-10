"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteAsset, describeImage, recordUpload } from "@/features/media/actions";
import type { LibraryAsset } from "@/features/media/queries";
import { Alert, AlertDescription } from "@/components/ui/admin/alert";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent } from "@/components/ui/admin/card";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";
import { EmptyState, FilterCard, FlatBadge, SearchField } from "@/components/shared/admin/list-ui";

type Props = {
  resourceType: "image" | "video";
  assets: LibraryAsset[];
  cursor: string | null;
  canUpload: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

function size(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// Safari plays HLS natively, everyone else needs the library, so it is fetched only once a
// preview is opened.
function Player({ stream, fallback }: { stream: string; fallback: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
      return;
    }

    let cancelled = false;
    let hls: { destroy: () => void } | undefined;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        video.src = fallback;
        return;
      }
      const instance = new Hls();
      hls = instance;
      instance.loadSource(stream);
      instance.attachMedia(video);
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [stream, fallback]);

  return <video ref={ref} controls playsInline className="w-full rounded-md bg-black" />;
}

export function AssetLibrary({ resourceType, assets, cursor, canUpload, canUpdate, canDelete }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const typing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const video = resourceType === "video";

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "cursor") next.delete("cursor");
    router.replace(`/admin/${video ? "videos" : "images"}?${next}`);
  };

  // Every search is a Cloudinary Admin API call, which is rate limited, so it waits for a pause
  // in the typing rather than firing per keystroke.
  const search = (value: string) => {
    clearTimeout(typing.current);
    typing.current = setTimeout(() => set("q", value), 400);
  };

  // The file goes from here straight to Cloudinary. Our server only signs the request and then
  // records what landed, so a large video never passes through a Next route.
  const send = async (file: File, opts: { folder?: string; publicId?: string; altText?: string }) => {
    setBusy(true);
    setMessage(null);
    try {
      const signed = await fetch("/api/admin/media/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resourceType, folder: opts.folder, publicId: opts.publicId }),
      });
      const ticket = (await signed.json()) as {
        ok: boolean;
        error?: string;
        data?: { endpoint: string; apiKey: string; params: Record<string, string> };
      };
      if (!ticket.ok || !ticket.data) {
        setMessage(ticket.error ?? "The upload could not be started.");
        return;
      }

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", ticket.data.apiKey);
      for (const [key, value] of Object.entries(ticket.data.params)) body.append(key, value);

      const uploaded = await fetch(ticket.data.endpoint, { method: "POST", body });
      if (!uploaded.ok) {
        const detail = (await uploaded.json().catch(() => null)) as { error?: { message?: string } } | null;
        setMessage(detail?.error?.message ?? "Cloudinary refused that file.");
        return;
      }
      const { public_id: publicId } = (await uploaded.json()) as { public_id: string };

      const result = await recordUpload({ publicId, resourceType, altText: opts.altText });
      setMessage(result.ok ? "Uploaded." : result.error);
      if (result.ok) router.refresh();
    } catch {
      setMessage("The upload did not go through. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        <FilterCard>
          <SearchField
            id="asset-search"
            defaultValue={params.get("q") ?? ""}
            placeholder="Part of the file name"
            onChange={search}
          />
        </FilterCard>
      </form>

      {canUpload ? (
        <Card>
          <CardContent className="pt-6">
            <form
              className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                const file = data.get("file");
                if (!(file instanceof File) || file.size === 0) return;
                await send(file, {
                  folder: String(data.get("folder") ?? "general"),
                  altText: String(data.get("altText") ?? ""),
                });
                form.reset();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="asset-file">{video ? "Video file" : "Image file"}</Label>
                <Input id="asset-file" name="file" type="file" required accept={video ? "video/mp4,video/webm" : "image/*"} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="asset-folder">Folder</Label>
                <Input id="asset-folder" name="folder" defaultValue="general" pattern="[a-z0-9]+(-[a-z0-9]+)*" />
              </div>
              {video ? null : (
                <div className="space-y-1.5">
                  <Label htmlFor="asset-alt">Alt text</Label>
                  <Input id="asset-alt" name="altText" placeholder="What the image shows" />
                </div>
              )}
              <div>
                <Button type="submit" disabled={busy}>
                  {busy ? "Uploading" : "Upload"}
                </Button>
              </div>
            </form>
            {video ? (
              <p className="pt-3 text-sm text-muted-foreground">
                Streaming versions are built after the upload, so a new video can take a minute before it plays.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Your role cannot upload.</p>
      )}

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {assets.length === 0 ? (
        <EmptyState>Nothing matches. Clear the search, or upload a file.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <Card key={asset.publicId} className="overflow-hidden">
              {playing === asset.publicId ? (
                <Player stream={asset.viewUrl} fallback={asset.secureUrl} />
              ) : (
                <img
                  src={asset.thumbUrl}
                  alt={asset.reference?.altText ?? ""}
                  className="aspect-4/3 w-full bg-secondary object-contain"
                  loading="lazy"
                />
              )}

              <CardContent className="space-y-2 pt-4">
                <p className="truncate text-sm" title={asset.publicId}>
                  {asset.filename}
                </p>
                <p className="text-xs break-all text-muted-foreground">
                  {asset.publicId}
                  <br />
                  {[asset.format.toUpperCase(), asset.width ? `${asset.width}x${asset.height}` : null, size(asset.bytes), asset.createdAt.slice(0, 10)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {/* Only assets a CMS section can point at need alt text. The rest of the library
                    is art the pages resolve straight from Cloudinary. */}
                {!video && asset.reference && asset.reference.altText === null ? (
                  <FlatBadge variant="destructive">Needs alt text</FlatBadge>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {video ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPlaying(playing === asset.publicId ? null : asset.publicId)}
                    >
                      {playing === asset.publicId ? "Stop" : "Play"}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <a href={asset.viewUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </Button>
                  )}
                  {canUpdate || canDelete ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpen(open === asset.publicId ? null : asset.publicId)}
                    >
                      {open === asset.publicId ? "Close" : "Manage"}
                    </Button>
                  ) : null}
                </div>

                {open === asset.publicId ? (
                  <div className="space-y-3">
                    {!video && canUpdate ? (
                      <form
                        className="space-y-3"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          const result = await describeImage({
                            publicId: asset.publicId,
                            filename: asset.filename,
                            altText: form.get("altText"),
                            caption: form.get("caption"),
                          });
                          setMessage(result.ok ? "Saved." : result.error);
                          if (result.ok) router.refresh();
                        }}
                      >
                        <div className="space-y-1.5">
                          <Label htmlFor={`alt-${asset.publicId}`}>Alt text</Label>
                          <Input
                            id={`alt-${asset.publicId}`}
                            name="altText"
                            defaultValue={asset.reference?.altText ?? ""}
                            placeholder="What the image shows"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`caption-${asset.publicId}`}>Caption</Label>
                          <Input id={`caption-${asset.publicId}`} name="caption" defaultValue={asset.reference?.caption ?? ""} />
                        </div>
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                      </form>
                    ) : null}

                    {canUpdate ? (
                      <div className="space-y-1.5">
                        <Label htmlFor={`replace-${asset.publicId}`}>Replace the file</Label>
                        <Input
                          id={`replace-${asset.publicId}`}
                          type="file"
                          accept={video ? "video/mp4,video/webm" : "image/*"}
                          disabled={busy}
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            await send(file, { publicId: asset.publicId });
                            event.target.value = "";
                          }}
                        />
                      </div>
                    ) : null}

                    {canDelete ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!window.confirm(`Delete ${asset.publicId}?`)) return;
                          const result = await deleteAsset({ publicId: asset.publicId, resourceType });
                          setMessage(result.ok ? "Deleted." : result.error);
                          if (result.ok) router.refresh();
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {cursor ? (
        <Button type="button" variant="outline" size="sm" onClick={() => set("cursor", cursor)}>
          Next page
        </Button>
      ) : null}
    </>
  );
}
