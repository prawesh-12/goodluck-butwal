"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Repeater, SaveBar, TextArea } from "@/components/admin/repeater";

export type FaqRow = { id?: string; question: string; answerHtml: string };

type SaveResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// The same screen for both destination and service questions. Order here is order on the site.
export function FaqEditor({
  ownerId,
  ownerName,
  viewHref,
  rows,
  save,
}: {
  ownerId: string;
  ownerName: string;
  viewHref: string;
  rows: FaqRow[];
  save: (input: unknown) => Promise<SaveResult>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<FaqRow[]>(rows);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = await save({ ownerId, items });
        setBusy(false);
        setProblems(result.ok ? [] : Object.values(result.fieldErrors ?? {}).flat());
        setMessage(result.ok ? "Saved." : result.error);
        if (result.ok) router.refresh();
      }}
    >
      <Repeater
        label={`Questions on ${ownerName}`}
        help="These fill the accordion on the page, in this order. They also feed the site-wide FAQ page."
        items={items}
        blank={() => ({ question: "", answerHtml: "" })}
        onChange={setItems}
        addLabel="Add a question"
        emptyLabel="No questions yet. Add the first one."
      >
        {(item, update) => (
          <>
            <Field label="Question" value={item.question} onChange={(question) => update({ question })} />
            <TextArea
              label="Answer"
              help="Plain paragraphs. Anything the site cannot style is stripped when you save."
              rows={4}
              value={item.answerHtml}
              onChange={(answerHtml) => update({ answerHtml })}
            />
          </>
        )}
      </Repeater>

      <SaveBar busy={busy} message={message} problems={problems} viewHref={viewHref} />
    </form>
  );
}
