"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export type DropdownOption = { value: string; label: string; disabled?: boolean };

const ADMIN_TRIGGER =
  "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1";
const ADMIN_LIST =
  "fixed z-50 max-h-64 min-w-32 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md";
const ADMIN_OPTION =
  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[active]:bg-accent data-[active]:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50";

// Walks past disabled options and stops at the ends rather than wrapping, the way a native
// select does.
export function nextEnabled(options: DropdownOption[], from: number, by: number): number {
  for (let i = from + by; i >= 0 && i < options.length; i += by) {
    if (!options[i].disabled) return i;
  }
  return from >= 0 && from < options.length ? from : -1;
}

export function matchTyped(options: DropdownOption[], text: string): number {
  const wanted = text.toLowerCase();
  return options.findIndex(
    (option) => !option.disabled && option.label.toLowerCase().startsWith(wanted),
  );
}

type Props = {
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  labelledBy?: string;
  ariaLabel?: string;
  required?: boolean;
  placeholder?: string;
  // The admin and the public forms look nothing alike, so the two skins pass their own classes
  // rather than the component carrying a variant flag.
  triggerClassName?: string;
  listClassName?: string;
  optionClassName?: string;
};

export function Dropdown({
  options,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  labelledBy,
  ariaLabel,
  required,
  placeholder,
  triggerClassName = ADMIN_TRIGGER,
  listClassName = ADMIN_LIST,
  optionClassName = ADMIN_OPTION,
}: Props) {
  const controlled = value !== undefined;
  const [own, setOwn] = useState(defaultValue ?? "");
  const current = controlled ? value : own;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Rows sit inside .admin-table, which clips its corners, so the list is positioned against the
  // viewport instead of the trigger to escape that.
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;

  const selected = options.findIndex((option) => option.value === current);
  const label = selected >= 0 ? options[selected].label : (placeholder ?? "");

  const place = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const show = () => {
    setActive(selected >= 0 ? selected : 0);
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    if (!controlled) setOwn(option.value);
    // A hidden input set by React fires nothing, so a form watching onChange to enable its
    // submit button would never hear about the pick.
    const input = hiddenRef.current;
    if (input) {
      input.value = option.value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const step = (from: number, by: number) => nextEnabled(options, from, by);
  const edge = (by: number) => (by > 0 ? step(-1, 1) : step(options.length, -1));

  // Jumping to an option by typing its first letters is the one native behaviour people notice
  // is missing. A pause of a second starts a new search.
  const search = (key: string) => {
    const now = Date.now();
    typed.current.text = now - typed.current.at > 1000 ? key : typed.current.text + key;
    typed.current.at = now;

    const at = matchTyped(options, typed.current.text);
    if (at >= 0) {
      if (open) setActive(at);
      else commit(at);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      search(event.key);
      return;
    }

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const by = event.key === "ArrowDown" ? 1 : -1;
        if (!open) show();
        else setActive((at) => step(at, by));
        break;
      }
      case "Home":
      case "End": {
        if (!open) return;
        event.preventDefault();
        setActive(edge(event.key === "Home" ? 1 : -1));
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        if (open) commit(active);
        else show();
        break;
      }
      case "Escape": {
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        break;
      }
      case "Tab": {
        setOpen(false);
        break;
      }
    }
  };

  return (
    <>
      {name ? <input ref={hiddenRef} type="hidden" name={name} value={current} readOnly /> : null}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        disabled={disabled}
        aria-required={required || undefined}
        className={triggerClassName}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span className="truncate">{label}</span>
        <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true" className="ml-2 shrink-0 opacity-50">
          <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          aria-label={ariaLabel}
          className={listClassName}
          style={{ top: box.top, left: box.left, width: Math.max(box.width, 128) }}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === selected}
              aria-disabled={option.disabled || undefined}
              data-active={index === active || undefined}
              className={optionClassName}
              onPointerEnter={() => !option.disabled && setActive(index)}
              onClick={() => commit(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
