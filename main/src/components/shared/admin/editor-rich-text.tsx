"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { MediaPicker, mediaSrc } from "@/features/media/components/media-picker";
import { findBodyImage } from "@/features/posts/actions";

export default function RichText({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
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
    editorProps: { attributes: { class: "article" } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  if (!editor) return <p className="t-small admin-empty">Loading the editor.</p>;

  const link = () => {
    const href = window.prompt("Web address", editor.getAttributes("link").href ?? "https://");
    if (href === null) return;
    if (href === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const insertImage = async (id: string | null) => {
    if (!id) return;
    const found = await findBodyImage({ id });
    if (!found.ok) {
      window.alert(found.error);
      return;
    }
    if (!found.data.altText) {
      window.alert("That image has no alt text. Add it in Media first, or the post cannot be published.");
    }
    editor
      .chain()
      .focus()
      .setImage({ src: mediaSrc(found.data, 960), alt: found.data.altText ?? "" })
      .run();
  };

  return (
    <div className="admin-field">
      <span className="t-small">{label}</span>

      <div className="admin-actions">
        <button type="button" className="admin-btn" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </button>
        <button type="button" className="admin-btn" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </button>
        <button
          type="button"
          className="admin-btn"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Heading
        </button>
        <button
          type="button"
          className="admin-btn"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          Subheading
        </button>
        <button type="button" className="admin-btn" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Bullets
        </button>
        <button type="button" className="admin-btn" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          Numbers
        </button>
        <button type="button" className="admin-btn" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </button>
        <button type="button" className="admin-btn" onClick={link}>
          Link
        </button>
        <button type="button" className="admin-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          Divider
        </button>
        <button
          type="button"
          className="admin-btn"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          Table
        </button>
      </div>

      <EditorContent editor={editor} />

      <MediaPicker
        label="Add a picture to the body"
        name="bodyImage"
        help="Pictures come from the media library so every one has alt text."
        onChange={insertImage}
      />

      <span className="t-small admin-help">{help}</span>
    </div>
  );
}
