"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/admin/button";
import { Card, CardContent } from "@/components/ui/admin/card";
import { Label } from "@/components/ui/admin/label";

// An ordered list of sub-records inside an editor: gallery slides, syllabus rows. Order matters on
// the public page, so each row can move rather than only be added and removed.
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
  children: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
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

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : null}

      {items.map((item, index) => (
        <Card key={index} className="shadow-none">
          <CardContent className="space-y-4">
            {children(item, update(index), index)}
            <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Move up"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                >
                  <ArrowUp />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Move down"
                  onClick={() => move(index, index + 1)}
                  disabled={index === items.length - 1}
                >
                  <ArrowDown />
                  <span className="sr-only">Move down</span>
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blank()])}>
        <Plus />
        {addLabel}
      </Button>
    </section>
  );
}
