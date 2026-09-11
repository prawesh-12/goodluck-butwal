"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { Bold, Italic, Link2 } from "lucide-react";
import { toast } from "sonner";
import { matchSlash, SlashCommand, slashItems } from "@/components/shared/admin/editor-slash-menu";
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

function ImageDialog({ editor, open, onOpenChange }: { editor: Editor; open: boolean; onOpenChange: (open: boolean) => void }) {
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a picture</DialogTitle>
          <DialogDescription>Pictures come from the image library so each one has a description.</DialogDescription>
        </DialogHeader>
        <MediaPicker label="Picture" name="bodyImage" onChange={insert} />
      </DialogContent>
    </Dialog>
  );
}

export default function RichText({
  label,
  help,
  value,
  onChange,
  // A news body is the whole point of its page and wants room; entry requirements on a course
  // do not. The caller knows which it is.
  minHeight = "min-h-80",
}: {
  label?: string;
  help?: string;
  value: string;
  onChange: (html: string) => void;
  minHeight?: string;
}) {
  const [imageOpen, setImageOpen] = useState(false);
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
      Placeholder.configure({ placeholder: "Write, or type / to add a heading, list, picture or table" }),
      SlashCommand.configure({ items: (query) => matchSlash(slashItems(() => setImageOpen(true)), query) }),
    ],
    editorProps: {
      attributes: {
        class: `article ${minHeight} max-w-[70ch] px-4 py-3 focus:outline-none`,
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

      <div className="rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: current, state }) => !state.selection.empty && !current.isActive("image")}
          className="flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 shadow-md"
        >
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
          <LinkDialog editor={editor} />
        </BubbleMenu>

        <EditorContent editor={editor} />
        <ImageDialog editor={editor} open={imageOpen} onOpenChange={setImageOpen} />
      </div>

      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}
