"use client";

import { useId, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/admin/badge";
import { Button } from "@/components/ui/admin/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/admin/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/admin/popover";
import { Checkbox } from "@/components/ui/admin/checkbox";
import { Input } from "@/components/ui/admin/input";
import { Label } from "@/components/ui/admin/label";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/admin/select";
import { Switch } from "@/components/ui/admin/switch";
import { Textarea } from "@/components/ui/admin/textarea";
import { cn } from "@/components/ui/admin/cn";

export type Option = { value: string; label: string; disabled?: boolean };

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span aria-hidden className="ml-0.5 font-semibold text-destructive">
          *
        </span>
      ) : null}
    </Label>
  );
}

export function FieldShell({
  name,
  label,
  help,
  error,
  hint,
  required,
  children,
  className,
}: {
  name?: string;
  label?: string;
  help?: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-field={name} className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-2">
          <FieldLabel required={required}>{label}</FieldLabel>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  help,
  error,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  disabled,
  required,
  className,
}: {
  name?: string;
  label: string;
  help?: ReactNode;
  error?: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div data-field={name} className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  help,
  error,
  hint,
  value,
  onChange,
  rows = 4,
  placeholder,
  required,
  className,
}: {
  name?: string;
  label: string;
  help?: ReactNode;
  error?: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div data-field={name} className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Radix Select has no value for "nothing picked", so an empty choice is carried as a sentinel and
// swapped back at the edges.
const NONE = "__none__";

export function SelectField({
  name,
  label,
  help,
  error,
  value,
  onChange,
  options,
  placeholder = "Select",
  emptyLabel,
  disabled,
  required,
  className,
}: {
  name?: string;
  label: string;
  help?: ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div data-field={name} className={cn("space-y-2", className)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <SelectRoot
        value={value === "" ? (emptyLabel ? NONE : null) : value}
        disabled={disabled}
        onValueChange={(next) => onChange(!next || next === NONE ? "" : next)}
        items={[...(emptyLabel ? [{ value: NONE, label: emptyLabel }] : []), ...options.map((option) => ({ value: option.value, label: option.label }))]}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyLabel ? <SelectItem value={NONE}>{emptyLabel}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckboxField({
  label,
  help,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(next) => onChange(next === true)} />
      <div className="grid gap-1 leading-none">
        <Label htmlFor={id}>
          {label}
        </Label>
        {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      </div>
    </div>
  );
}

export function SwitchField({
  label,
  help,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="space-y-1">
        <Label htmlFor={id}>
          {label}
        </Label>
        {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

export function CheckboxGroup({
  name,
  label,
  help,
  error,
  options,
  selected,
  onChange,
  columns = 3,
  required,
}: {
  name?: string;
  label: string;
  help?: ReactNode;
  error?: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  columns?: 2 | 3 | 4;
  required?: boolean;
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);

  return (
    <FieldShell name={name} label={label} help={help} error={error} required={required}>
      <div
        className={cn(
          "grid gap-x-4 gap-y-3 sm:grid-cols-2",
          columns === 3 && "lg:grid-cols-3",
          columns === 4 && "lg:grid-cols-4",
        )}
      >
        {options.map((option) => (
          <CheckboxField
            key={option.value}
            label={option.label}
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
        ))}
      </div>
    </FieldShell>
  );
}

export type OfficeOption = { id: string; name: string };

export function MultiSelectField({
  name,
  label,
  help,
  error,
  options,
  selected,
  onChange,
  placeholder = "Choose",
  searchPlaceholder = "Search",
  emptyMessage = "Nothing found.",
  required,
}: {
  name?: string;
  label: string;
  help?: ReactNode;
  error?: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const chosen = options.filter((option) => selected.includes(option.value));

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);

  return (
    <FieldShell name={name} label={label} help={help} error={error} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-required={required || undefined}
            className="h-auto min-h-9 w-full justify-between px-3" />}>
            <span className="flex flex-wrap items-center gap-1 py-0.5">
              {chosen.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                chosen.map((option) => (
                  <Badge key={option.value} variant="secondary">
                    {option.label}
                  </Badge>
                ))
              )}
            </span>
            <ChevronsUpDown className="shrink-0 opacity-50" />
          </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                    <Check className={cn("mr-2 size-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}

// A single-choice field with a search box, for lists too long to scan in a plain select.
export function ComboboxField({
  name,
  label,
  help,
  error,
  value,
  onChange,
  options,
  placeholder = "Choose",
  searchPlaceholder = "Search",
  emptyMessage = "Nothing found.",
  disabled,
  required,
  className,
}: {
  name?: string;
  label: string;
  help?: ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);

  return (
    <FieldShell name={name} label={label} help={help} error={error} required={required} className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            aria-required={required || undefined}
            aria-invalid={Boolean(error) || undefined}
            className="w-full justify-between px-3 font-medium" />}>
            <span className={cn("truncate", !chosen && "text-muted-foreground")}>
              {chosen ? chosen.label : placeholder}
            </span>
            <ChevronsUpDown className="shrink-0 opacity-50" />
          </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => {
                      onChange(option.value === value ? "" : option.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", option.value === value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}

// A list the user builds a word at a time: qualifications, areas of expertise. The Add button is
// there so nobody has to guess that Enter is what commits an entry.
export function ChipField({
  name,
  label,
  help,
  error,
  placeholder,
  values,
  onChange,
  required,
}: {
  name?: string;
  label: string;
  help?: ReactNode;
  error?: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    setDraft("");
    if (!value || values.includes(value)) return;
    onChange([...values, value]);
  };

  return (
    <FieldShell name={name} label={label} help={help} error={error} required={required}>
      <div className="space-y-2">
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {values.map((value) => (
              <Badge key={value} variant="secondary" className="gap-1 py-1">
                {value}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onChange(values.filter((item) => item !== value))}
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove {value}</span>
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== ",") return;
              // Enter inside a form would submit it, and a comma is how people type lists.
              event.preventDefault();
              add();
            }}
          />
          <Button type="button" variant="outline" onClick={add} disabled={draft.trim() === ""}>
            <Plus />
            Add
          </Button>
        </div>
      </div>
    </FieldShell>
  );
}
