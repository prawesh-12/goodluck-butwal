"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table,
} from "lucide-react";
import { toast } from "sonner";
import { MediaPicker } from "@/features/media/components/media-picker";
import { mediaUrl } from "@/lib/utils/media-url";
import { findBodyImage } from "@/features/posts/actions";
import { Button } from "@/components/ui/admin/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/admin/dialog";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";
import { Separator } from "@/components/ui/admin/separator";
import { Skeleton } from "@/components/ui/admin/skeleton";
import { Toggle } from "@/components/ui/admin/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/admin/tooltip";

function ToolButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof Bold;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={Boolean(active)}
          aria-label={label}
          onPressedChange={onClick}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Icon />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function LinkDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");

  const start = () => {
    setHref(editor.getAttributes("link").href ?? "https://");
    setOpen(true);
  };

  const apply = () => {
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href.trim() === "") chain.unsetLink().run();
    else chain.setLink({ href: href.trim() }).run();
    setOpen(false);
  };

  return (
    <>
      <ToolButton label="Link" icon={Link2} active={editor.isActive("link")} onClick={start} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link</DialogTitle>
            <DialogDescription>Leave it empty to remove the link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rich-text-link">Web address</Label>
            <Input
              id="rich-text-link"
              autoFocus
              value={href}
              onChange={(event) => setHref(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  apply();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={apply}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ImageDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);

  const insert = async (id: string | null) => {
    if (!id) return;
    const found = await findBodyImage({ id });
    if (!found.ok) {
      toast.error("Couldn't add that picture.", { description: found.error });
      return;
    }
    if (!found.data.altText) {
      toast.warning("That picture has no description.", {
        description: "Add one in Images, or the article cannot go live.",
      });
    }
    editor
      .chain()
      .focus()
      .setImage({ src: mediaUrl(found.data, 960), alt: found.data.altText ?? "" })
      .run();
    setOpen(false);
  };

  return (
    <>
      <ToolButton label="Picture" icon={ImagePlus} onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a picture</DialogTitle>
            <DialogDescription>Pictures come from the image library so each one has a description.</DialogDescription>
          </DialogHeader>
          <MediaPicker label="Picture" name="bodyImage" onChange={insert} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function RichText({
  label,
  help,
  value,
  onChange,
}: {
  label?: string;
  help?: string;
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    content: value,
    extensions: [
      // Only what the .article styles cover. h1 belongs to the page, never to a body.
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        underline: false,
        strike: false,
        link: { openOnClick: false },
      }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
    ],
    editorProps: {
      attributes: {
        class: "article min-h-80 max-w-[70ch] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  if (!editor) {
    return (
      <div className="space-y-2">
        {label ? <Label>{label}</Label> : null}
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}

      <div className="overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/50 p-1.5">
          <ToolButton
            label="Bold"
            icon={Bold}
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolButton
            label="Italic"
            icon={Italic}
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />

          <Separator orientation="vertical" className="mx-1 h-5" />

          <ToolButton
            label="Heading"
            icon={Heading2}
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolButton
            label="Subheading"
            icon={Heading3}
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />

          <Separator orientation="vertical" className="mx-1 h-5" />

          <ToolButton
            label="Bullets"
            icon={List}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolButton
            label="Numbered list"
            icon={ListOrdered}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolButton
            label="Quote"
            icon={Quote}
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />

          <Separator orientation="vertical" className="mx-1 h-5" />

          <LinkDialog editor={editor} />
          <ToolButton
            label="Divider"
            icon={Minus}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
          <ToolButton
            label="Table"
            icon={Table}
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          />
          <ImageDialog editor={editor} />
        </div>

        <EditorContent editor={editor} />
      </div>

      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}
