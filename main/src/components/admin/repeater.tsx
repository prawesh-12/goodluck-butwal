"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  help,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  help?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="admin-field">
      <span className="t-small">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {help ? <span className="t-small admin-help">{help}</span> : null}
      {error ? <span className="admin-clash">{error}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  help,
  error,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  help?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="admin-field">
      <span className="t-small">{label}</span>
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
      {help ? <span className="t-small admin-help">{help}</span> : null}
      {error ? <span className="admin-clash">{error}</span> : null}
    </label>
  );
}

export function Select({
  label,
  help,
  error,
  value,
  onChange,
  options,
}: {
  label: string;
  help?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <label className="admin-field">
      <span className="t-small">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {help ? <span className="t-small admin-help">{help}</span> : null}
      {error ? <span className="admin-clash">{error}</span> : null}
    </label>
  );
}

export function Toggle({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="admin-field">
      <span className="t-small">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
      </span>
      {help ? <span className="t-small admin-help">{help}</span> : null}
    </label>
  );
}

// One list of rows, in the order the site shows them. Add, remove, and move a row up or down.
export function Repeater<T>({
  label,
  help,
  items,
  blank,
  onChange,
  addLabel = "Add",
  emptyLabel = "Nothing here yet.",
  children,
}: {
  label: string;
  help?: string;
  items: T[];
  blank: () => T;
  onChange: (items: T[]) => void;
  addLabel?: string;
  emptyLabel?: string;
  children: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  const update = (index: number) => (patch: Partial<T>) =>
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <section className="admin-field">
      <span className="t-small">{label}</span>
      {help ? <span className="t-small admin-help">{help}</span> : null}

      {items.length === 0 ? <p className="t-small admin-empty">{emptyLabel}</p> : null}

      {items.map((item, index) => (
        <div key={index} className="admin-tile">
          {children(item, update(index), index)}
          <div className="admin-actions">
            <button type="button" className="btn-black-sm" onClick={() => move(index, index - 1)} disabled={index === 0}>
              Up
            </button>
            <button
              type="button"
              className="btn-black-sm"
              onClick={() => move(index, index + 1)}
              disabled={index === items.length - 1}
            >
              Down
            </button>
            <button
              type="button"
              className="btn-black-sm"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="admin-actions">
        <button type="button" className="btn-black-sm" onClick={() => onChange([...items, blank()])}>
          {addLabel}
        </button>
      </div>
    </section>
  );
}

export function SaveBar({
  busy,
  message,
  problems,
  onDelete,
  viewHref,
}: {
  busy: boolean;
  message: string | null;
  problems?: string[];
  onDelete?: () => void;
  viewHref?: string;
}) {
  return (
    <>
      {problems && problems.length > 0 ? (
        <ul className="admin-field">
          {problems.map((problem) => (
            <li key={problem} className="admin-clash">
              {problem}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="admin-actions">
        <button type="submit" className="btn-black-sm" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>
        {viewHref ? (
          <a className="btn-black-sm" href={viewHref} target="_blank" rel="noreferrer">
            View on site
          </a>
        ) : null}
        {onDelete ? (
          <button type="button" className="btn-black-sm" onClick={onDelete} disabled={busy}>
            Delete
          </button>
        ) : null}
        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </>
  );
}
