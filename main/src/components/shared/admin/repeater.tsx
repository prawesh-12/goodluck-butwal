"use client";

import { useId, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/admin/input";
import { Textarea } from "@/components/ui/admin/textarea";
import { Label } from "@/components/ui/admin/label";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent } from "@/components/ui/admin/card";
import { Alert, AlertDescription } from "@/components/ui/admin/alert";

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
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
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
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

export function Select({
  label,
  help,
  error,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  options,
}: {
  label: string;
  help?: ReactNode;
  error?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  options: DropdownOption[];
}) {
  const labelId = useId();

  return (
    <div className="space-y-1.5">
      <Label id={labelId}>{label}</Label>
      <Dropdown
        options={options}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        name={name}
        disabled={disabled}
        labelledBy={labelId}
      />
      {help ? <div className="text-xs text-muted-foreground">{help}</div> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
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
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2.5 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-primary"
        />
        <span className="font-medium">{label}</span>
      </label>
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
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
    <section className="space-y-3">
      <div className="space-y-1">
        <Label>{label}</Label>
        {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      </div>

      {items.length === 0 ? <p className="text-sm text-muted-foreground">{emptyLabel}</p> : null}

      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="space-y-4 pt-6">
            {children(item, update(index), index)}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => move(index, index - 1)} disabled={index === 0}>
                <ArrowUp /> Up
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => move(index, index + 1)}
                disabled={index === items.length - 1}
              >
                <ArrowDown /> Down
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                <Trash2 /> Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blank()])}>
          {addLabel}
        </Button>
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
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc space-y-0.5 pl-4">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </Button>
        {viewHref ? (
          <Button type="button" variant="outline" asChild>
            <a href={viewHref} target="_blank" rel="noreferrer">
              View on site
            </a>
          </Button>
        ) : null}
        {onDelete ? (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={busy}>
            <Trash2 /> Delete
          </Button>
        ) : null}
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>
    </>
  );
}
