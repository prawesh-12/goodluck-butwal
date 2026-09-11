"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordUpload } from "@/features/media/actions";
import { Button } from "@/components/ui/admin/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/admin/dialog";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";
import { Progress } from "@/components/ui/admin/progress";
import { TextField } from "@/components/shared/admin/fields";
import { fileSize, plainError, type ResourceType } from "@/features/media/components/asset-utils";

export const ACCEPT: Record<ResourceType, string> = {
  image: "image/jpeg,image/png,image/webp,image/avif",
  video: "video/mp4,video/webm",
};

type Ticket = { endpoint: string; apiKey: string; params: Record<string, string> };
type Sent = { ok: true } | { ok: false; error: string };

// The file goes from the browser straight to the host, so the progress of the transfer is only
// visible on the request itself, which fetch does not report.
function transfer(ticket: Ticket, file: File, onProgress: (percent: number) => void) {
  return new Promise<string | null>((resolve) => {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", ticket.apiKey);
    for (const [key, value] of Object.entries(ticket.params)) body.append(key, value);

    const request = new XMLHttpRequest();
    request.open("POST", ticket.endpoint);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      try {
        const parsed = JSON.parse(request.responseText) as { public_id?: string };
        resolve(request.status >= 200 && request.status < 300 ? (parsed.public_id ?? null) : null);
      } catch {
        resolve(null);
      }
    });
    request.addEventListener("error", () => resolve(null));
    request.send(body);
  });
}

// Our server signs the request and records what landed. It never sees the bytes, which is what
// keeps a large video off the Next route.
export async function uploadAsset(
  file: File,
  opts: { resourceType: ResourceType; folder?: string; publicId?: string; altText?: string },
  onProgress: (percent: number) => void,
): Promise<Sent> {
  try {
    const signed = await fetch("/api/admin/media/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resourceType: opts.resourceType, folder: opts.folder, publicId: opts.publicId }),
    });
    const ticket = (await signed.json()) as { ok: boolean; error?: string; data?: Ticket };
    if (!ticket.ok || !ticket.data) return { ok: false, error: plainError(ticket.error, opts.resourceType) };

    const publicId = await transfer(ticket.data, file, onProgress);
    if (!publicId) return { ok: false, error: "That file was refused. Check the format and try again." };

    const recorded = await recordUpload({ publicId, resourceType: opts.resourceType, altText: opts.altText });
    return recorded.ok ? { ok: true } : { ok: false, error: plainError(recorded.error, opts.resourceType) };
  } catch {
    return { ok: false, error: "The upload did not go through. Try again." };
  }
}

type State = "queued" | "uploading" | "uploaded" | "failed";
type Row = { id: number; file: File; state: State; percent: number; error?: string };

const LABEL: Record<State, string> = {
  queued: "Ready",
  uploading: "Uploading...",
  uploaded: "Uploaded",
  failed: "Failed",
};

export function UploadDialog({
  resourceType,
  trigger,
}: {
  resourceType: ResourceType;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState("general");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const video = resourceType === "video";
  const noun = video ? "video" : "image";
  const Noun = video ? "Video" : "Image";

  const patch = (id: number, changes: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  const close = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    if (!next) {
      setRows([]);
      setDescription("");
      if (picker.current) picker.current.value = "";
    }
  };

  const send = async (row: Row) => {
    patch(row.id, { state: "uploading", percent: 0, error: undefined });
    const result = await uploadAsset(
      row.file,
      { resourceType, folder: folder.trim() || "general", altText: description.trim() || undefined },
      (percent) => patch(row.id, { percent }),
    );
    patch(row.id, result.ok ? { state: "uploaded", percent: 100 } : { state: "failed", error: result.error });
    return result;
  };

  // One at a time, because that is what the signing route and the recording step were built for.
  const start = async (pending: Row[]) => {
    if (pending.length === 0) return;
    setBusy(true);
    let done = 0;
    let reason = "";
    for (const row of pending) {
      const result = await send(row);
      if (result.ok) done += 1;
      else if (!reason) reason = result.error;
    }
    setBusy(false);

    if (done > 0) {
      toast.success(done === 1 ? `${Noun} uploaded` : `${done} ${noun}s uploaded`);
      router.refresh();
    }
    const failed = pending.length - done;
    if (failed > 0) {
      toast.error(`Couldn't upload ${failed === 1 ? `one ${noun}` : `${failed} ${noun}s`}.`, { description: reason });
      return;
    }
    close(false);
  };

  const pending = rows.filter((row) => row.state !== "uploaded");

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload {noun}s</DialogTitle>
          <DialogDescription>
            {video
              ? "A streaming version is built after the upload, so a new video can take a minute before it plays."
              : "Pick one or more files. They are added to the library straight away."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <TextField
            name="folder"
            label="Folder"
            value={folder}
            onChange={setFolder}
            disabled={busy}
            help="Lower case letters, numbers and hyphens."
          />

          {video ? null : (
            <TextField
              name="description"
              label="Description"
              value={description}
              onChange={setDescription}
              disabled={busy}
              placeholder="What the picture shows"
              help={rows.length > 1 ? "Used for every file in this upload." : undefined}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="upload-files">Files</Label>
            <Input
              id="upload-files"
              ref={picker}
              type="file"
              multiple
              disabled={busy}
              accept={ACCEPT[resourceType]}
              onChange={(event) =>
                setRows(
                  [...(event.target.files ?? [])].map((file, index) => ({
                    id: index,
                    file,
                    state: "queued",
                    percent: 0,
                  })),
                )
              }
            />
          </div>

          {rows.map((row) => (
            <div key={row.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-medium" title={row.file.name}>
                  {row.file.name}
                </p>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{fileSize(row.file.size)}</span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {row.state === "uploaded" ? "100%" : row.state === "uploading" ? `${row.percent}%` : "—"}
                </span>
                <span className="shrink-0 text-xs font-medium">{LABEL[row.state]}</span>
                {row.state === "failed" ? (
                  <Button type="button" size="xs" variant="outline" disabled={busy} onClick={() => start([row])}>
                    Retry
                  </Button>
                ) : null}
              </div>
              {row.state === "uploading" ? (
                <Progress value={row.percent} aria-label={`Uploading ${row.file.name}`} />
              ) : null}
              {row.error ? <p className="text-xs text-destructive">{row.error}</p> : null}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => close(false)}>
            Close
          </Button>
          <Button type="button" disabled={busy || pending.length === 0} onClick={() => start(pending)}>
            {busy ? "Uploading..." : `Upload ${pending.length} ${pending.length === 1 ? noun : `${noun}s`}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
