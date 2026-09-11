"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Extension, ReactRenderer, type Editor, type Range } from "@tiptap/react";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import { Heading2, Heading3, Heading4, ImagePlus, List, ListOrdered, Minus, Quote, Table } from "lucide-react";

export type SlashItem = {
  title: string;
  hint: string;
  keywords: string;
  icon: typeof List;
  run: (editor: Editor, range: Range) => void;
};

const block = (run: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => (editor: Editor, range: Range) =>
  run(editor.chain().focus().deleteRange(range)).run();

export function slashItems(openImage: () => void): SlashItem[] {
  return [
    { title: "Heading", hint: "Big section title", keywords: "h2 title", icon: Heading2, run: block((c) => c.setNode("heading", { level: 2 })) },
    { title: "Subheading", hint: "Medium section title", keywords: "h3", icon: Heading3, run: block((c) => c.setNode("heading", { level: 3 })) },
    { title: "Small heading", hint: "Small section title", keywords: "h4", icon: Heading4, run: block((c) => c.setNode("heading", { level: 4 })) },
    { title: "Bullets", hint: "A plain list", keywords: "bullet list ul", icon: List, run: block((c) => c.toggleBulletList()) },
    { title: "Numbered list", hint: "A list with 1, 2, 3", keywords: "ordered ol steps", icon: ListOrdered, run: block((c) => c.toggleOrderedList()) },
    { title: "Quote", hint: "Pull out a sentence", keywords: "blockquote", icon: Quote, run: block((c) => c.toggleBlockquote()) },
    { title: "Divider", hint: "A line between sections", keywords: "hr rule line", icon: Minus, run: block((c) => c.setHorizontalRule()) },
    { title: "Table", hint: "Three by three, with a header row", keywords: "grid", icon: Table, run: block((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true })) },
    {
      title: "Picture",
      hint: "From the image library",
      keywords: "image photo media",
      icon: ImagePlus,
      run: (editor, range) => {
        editor.chain().focus().deleteRange(range).run();
        openImage();
      },
    },
  ];
}

export function matchSlash(items: SlashItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => `${item.title} ${item.keywords}`.toLowerCase().includes(q));
}

type MenuProps = SuggestionProps<SlashItem>;
type MenuRef = { onKeyDown: (props: SuggestionKeyDownProps) => boolean };

const SlashMenu = forwardRef<MenuRef, MenuProps>(function SlashMenu({ items, command }, ref) {
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelected((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) return null;
  return (
    <div role="listbox" aria-label="Insert" className="w-64 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
      {items.map((item, i) => (
        <button
          key={item.title}
          type="button"
          role="option"
          aria-selected={i === selected}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setSelected(i)}
          onClick={() => command(item)}
          className={`flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm ${i === selected ? "bg-accent text-accent-foreground" : ""}`}
        >
          <item.icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex flex-col">
            <span>{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
});

// The menu is rendered outside the editor and pinned to the caret, so it is never clipped by
// the editor's own overflow.
function renderMenu() {
  let component: ReactRenderer<MenuRef, MenuProps> | null = null;
  let el: HTMLElement | null = null;

  const place = (clientRect: MenuProps["clientRect"]) => {
    if (!el || !clientRect) return;
    const target = el;
    void computePosition({ getBoundingClientRect: () => clientRect() ?? new DOMRect() }, target, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      target.style.left = `${x}px`;
      target.style.top = `${y}px`;
    });
  };

  const close = () => {
    component?.destroy();
    el?.remove();
    component = null;
    el = null;
  };

  return {
    onStart: (props: MenuProps) => {
      component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
      el = component.element as HTMLElement;
      el.style.position = "fixed";
      el.style.zIndex = "50";
      document.body.appendChild(el);
      place(props.clientRect);
    },
    onUpdate: (props: MenuProps) => {
      component?.updateProps(props);
      place(props.clientRect);
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === "Escape") {
        close();
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit: close,
  };
}

export const SlashCommand = Extension.create<{ items: (query: string) => SlashItem[] }>({
  name: "slashCommand",
  addOptions() {
    return { items: () => [] };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        items: ({ query }) => this.options.items(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: renderMenu,
      }),
    ];
  },
});
