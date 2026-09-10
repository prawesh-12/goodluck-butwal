"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, ExternalLink, ImageIcon, Play, Settings2, Trash2, Upload, Video } from "lucide-react";
import { deleteAsset, describeImage } from "@/features/media/actions";
import type { LibraryAsset } from "@/features/media/queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/admin/alert";
import { Button } from "@/components/ui/admin/button";
import { Card } from "@/components/ui/admin/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/admin/dialog";
import { Progress } from "@/components/ui/admin/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/admin/sheet";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { TextField } from "@/components/shared/admin/fields";
import { FlatBadge, ResultCount } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";
import { useAction } from "@/components/shared/admin/use-action";
import {
  deleteBlock,
  fileSize,
  folderName,
  plainError,
  type DeleteBlock,
  type ResourceType,
} from "@/features/media/components/asset-utils";
import { ACCEPT, UploadDialog, uploadAsset } from "@/features/media/components/upload-dialog";

type Props = {
  resourceType: ResourceType;
  assets: LibraryAsset[];
  total: number;
  cursor: string | null;
  q: string;
  onFirstPage: boolean;
  canUpload: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const WORDS = {
  image: { one: "image", many: "images", One: "Image" },
  video: { one: "video", many: "videos", One: "Video" },
} as const;

function meta(asset: LibraryAsset) {
  return [asset.width ? `${asset.width} × ${asset.height}` : null, fileSize(asset.bytes), asset.format.toUpperCase()]
    .filter(Boolean)
    .join(" · ");
}

function uploadedOn(iso: string) {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// Safari plays the adaptive stream natively, everyone else needs the library, so it is fetched
// only once a video is actually opened.
function Player({ stream, fallback, title }: { stream: string; fallback: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
      return;
    }

    let cancelled = false;
    let player: { destroy: () => void } | undefined;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        video.src = fallback;
        return;
      }
      const instance = new Hls();
      player = instance;
      instance.loadSource(stream);
      instance.attachMedia(video);
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [stream, fallback]);

  return <video ref={ref} title={title} controls autoPlay playsInline className="w-full rounded-md bg-black" />;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{value}</dd>
    </div>
  );
}

function Blocked({ block, noun }: { block: DeleteBlock; noun: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>This {noun} can&apos;t be deleted yet.</AlertTitle>
      <AlertDescription>
        <p>{block.message}</p>
        {block.items.length > 0 ? (
          <ul className="space-y-0.5">
            {block.items.map((item) => (
              <li key={`${item.kind}-${item.label}`}>
                {item.kind}: {item.label}
              </li>
            ))}
            {block.more > 0 ? <li>and {block.more} more</li> : null}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function ManageSheet({
  asset,
  resourceType,
  canUpdate,
  canDelete,
  onClose,
  onPlay,
}: {
  asset: LibraryAsset;
  resourceType: ResourceType;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onPlay: () => void;
}) {
  const router = useRouter();
  const { busy, run } = useAction();
  const picker = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(asset.reference?.altText ?? "");
  const [caption, setCaption] = useState(asset.reference?.caption ?? "");
  const [replacing, setReplacing] = useState<number | null>(null);
  const [block, setBlock] = useState<DeleteBlock | null>(null);

  const video = resourceType === "video";
  const { one, One } = WORDS[resourceType];

  const describe = async (event: React.FormEvent) => {
    event.preventDefault();
    const saved = await run(
      async () => {
        const result = await describeImage({
          publicId: asset.publicId,
          filename: asset.filename,
          altText: description,
          caption,
        });
        return result.ok
          ? { ok: true as const, data: true }
          : { ok: false as const, error: plainError(result.error, resourceType) };
      },
      { success: "Description saved", failure: "Couldn't save the description." },
    );
    if (saved) router.refresh();
  };

  const replace = async (file: File) => {
    setReplacing(0);
    const result = await uploadAsset(file, { resourceType, publicId: asset.publicId }, setReplacing);
    setReplacing(null);
    if (!result.ok) {
      toast.error(`Couldn't replace this ${one}.`, { description: result.error });
      return;
    }
    toast.success(`${One} replaced`);
    onClose();
    router.refresh();
  };

  const remove = async () => {
    const deleted = await run(
      async () => {
        const result = await deleteAsset({ publicId: asset.publicId, resourceType });
        if (result.ok) return { ok: true as const, data: true };
        const reason = deleteBlock(result.error, resourceType);
        setBlock(reason);
        return {
          ok: false as const,
          error: reason.items.length > 0 ? `It is used by ${reason.items.map((item) => item.label).join(", ")}.` : reason.message,
        };
      },
      { success: `${One} deleted`, failure: `Couldn't delete this ${one}.` },
    );
    if (!deleted) return;
    onClose();
    router.refresh();
  };

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-8 wrap-break-word">{asset.filename}</SheetTitle>
          <SheetDescription>Uploaded {uploadedOn(asset.createdAt)}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <img
            src={video ? asset.thumbUrl : asset.viewUrl}
            alt={asset.reference?.altText ?? ""}
            className="max-h-64 w-full rounded-md bg-secondary object-contain"
          />

          <dl>
            <Detail label="Dimensions" value={asset.width ? `${asset.width} × ${asset.height}` : "Unknown"} />
            <Detail label="Format" value={asset.format.toUpperCase() || "Unknown"} />
            <Detail label="Size" value={fileSize(asset.bytes)} />
            <Detail label="Folder" value={folderName(asset.publicId)} />
          </dl>

          {!video && canUpdate ? (
            <form onSubmit={describe} className="space-y-4">
              <TextField
                name="altText"
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="What the picture shows"
                help="Read aloud to visitors who cannot see the picture."
              />
              <TextField name="caption" label="Caption" value={caption} onChange={setCaption} />
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? "Saving..." : "Save"}
              </Button>
            </form>
          ) : null}

          {replacing !== null ? <Progress value={replacing} aria-label={`Replacing this ${one}`} /> : null}
          {block ? <Blocked block={block} noun={one} /> : null}
        </div>

        <SheetFooter className="flex-row flex-wrap gap-2 border-t border-border">
          {video ? (
            <Button type="button" variant="outline" size="sm" onClick={onPlay}>
              <Play />
              Play
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <a href={asset.viewUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                Open
              </a>
            </Button>
          )}

          {canUpdate ? (
            <>
              <input
                ref={picker}
                type="file"
                hidden
                accept={ACCEPT[resourceType]}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void replace(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={replacing !== null}
                onClick={() => picker.current?.click()}
              >
                <Upload />
                {replacing !== null ? "Replacing..." : `Replace ${one}`}
              </Button>
            </>
          ) : null}

          {canDelete ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="destructive" size="sm" disabled={busy} className="ml-auto">
                  <Trash2 />
                  Delete
                </Button>
              }
              title={`Delete this ${one}?`}
              description="This cannot be undone."
              confirmLabel={`Delete ${one}`}
              onConfirm={remove}
            />
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function AssetGrid({
  resourceType,
  assets,
  total,
  cursor,
  q,
  onFirstPage,
  canUpload,
  canUpdate,
  canDelete,
}: Props) {
  const [manage, setManage] = useState<LibraryAsset | null>(null);
  const [playing, setPlaying] = useState<LibraryAsset | null>(null);

  const video = resourceType === "video";
  const { one, many } = WORDS[resourceType];
  const path = `/admin/${many}`;
  const Icon = video ? Video : ImageIcon;

  if (assets.length === 0) {
    return q ? (
      <EmptyState
        icon={Icon}
        title={`No ${many} match your search`}
        description="Try a different word, or clear the search to see everything."
        action={
          <Button variant="outline" asChild>
            <Link href={path}>Clear the search</Link>
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Icon}
        title={`No ${many} yet`}
        description={`Upload a ${one} to use it across the website.`}
        action={
          canUpload ? (
            <UploadDialog
              resourceType={resourceType}
              trigger={
                <Button>
                  <Upload />
                  Upload {many}
                </Button>
              }
            />
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => (
          <Card key={asset.publicId} className="flex flex-col gap-0 overflow-hidden py-0 shadow-none">
            <div className="relative">
              <img
                src={asset.thumbUrl}
                alt={asset.reference?.altText ?? ""}
                loading="lazy"
                className="aspect-4/3 w-full bg-secondary object-contain"
              />
              {video ? (
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center text-white drop-shadow"
                >
                  <Play className="size-8 fill-white/80" />
                </span>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
              <p className="truncate text-sm font-medium" title={asset.filename}>
                {asset.filename}
              </p>
              <p className="text-xs text-muted-foreground">{meta(asset)}</p>

              <div className="flex flex-wrap gap-1.5">
                <FlatBadge variant="outline">{folderName(asset.publicId)}</FlatBadge>
                {!video && asset.reference && asset.reference.altText === null ? (
                  <FlatBadge variant="destructive">Needs description</FlatBadge>
                ) : null}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-2">
                {video ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setPlaying(asset)}>
                    <Play />
                    Play
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href={asset.viewUrl} target="_blank" rel="noreferrer">
                      <ExternalLink />
                      Open
                    </a>
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => setManage(asset)}>
                  <Settings2 />
                  Manage
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {onFirstPage ? <ResultCount shown={assets.length} total={total} noun={many} /> : <span />}
        <div className="flex items-center gap-2">
          {onFirstPage ? null : (
            <Button variant="ghost" size="sm" asChild>
              <Link href={q ? `${path}?q=${encodeURIComponent(q)}` : path}>Back to the newest</Link>
            </Button>
          )}
          {cursor ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`${path}?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${encodeURIComponent(cursor)}`}>
                Next page
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {manage ? (
        <ManageSheet
          key={manage.publicId}
          asset={manage}
          resourceType={resourceType}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onClose={() => setManage(null)}
          onPlay={() => {
            setPlaying(manage);
            setManage(null);
          }}
        />
      ) : null}

      {playing ? (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next) setPlaying(null);
          }}
        >
          <DialogContent aria-describedby={undefined} className="sm:max-w-3xl">
            <DialogTitle className="truncate pr-8">{playing.filename}</DialogTitle>
            <Player stream={playing.viewUrl} fallback={playing.secureUrl} title={playing.filename} />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
