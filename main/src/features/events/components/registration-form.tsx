"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Field } from "@/components/shared/inner";
import { Turnstile } from "@/components/shared/turnstile";
import { trackFormSubmit } from "@/lib/integrations/analytics";
import type { FormText } from "@/features/site-text/form-text";

export function RegistrationForm({
  eventId,
  closed,
  seatsLeft,
  text,
}: {
  eventId: string;
  text: FormText;
  // The reason registration is not open, worked out on the server. Null means it is.
  closed: string | null;
  seatsLeft: number | null;
}) {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const onToken = useCallback((t: string) => setToken(t), []);

  if (closed) return <p className="t-body text-muted">{closed}</p>;

  if (done) return <p className="t-body text-ink">{text.event.success}</p>;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("Name"),
        email: form.get("Email"),
        phone: form.get("Phone") || undefined,
        attendees: Number(form.get("Attendees") || 1),
        notes: form.get("Notes") || undefined,
        sourcePage: typeof window === "undefined" ? undefined : window.location.pathname,
        company_website: form.get("company_website") || undefined,
        turnstileToken: token,
      }),
    });
    const result = (await res.json()) as { ok: boolean; error?: string };
    setBusy(false);
    if (result.ok) {
      trackFormSubmit("event_registration");
      setDone(true);
    }
    else setError(result.error ?? text.error);
  };

  return (
    <form
      onSubmit={submit}
      onChange={(event) =>
        setReady(
          ["Name", "Email"].every((name) =>
            (event.currentTarget.elements.namedItem(name) as HTMLInputElement)?.value.trim(),
          ),
        )
      }
      className="grid w-full gap-5 md:gap-[30px] lg:grid-cols-2"
    >
      {[text.note].filter(Boolean).map((line) => (
        <p key={line} className="t-base text-muted lg:col-span-2">{line}</p>
      ))}
      <Field label={text.field.name} name="Name" placeholder={text.field.nameHint} required />
      <Field label={text.field.email} name="Email" type="email" placeholder={text.field.emailHint} required />
      <Field label={text.field.phone} name="Phone" type="tel" placeholder={text.field.phoneHint} />
      <Field
        label={text.field.attendees}
        name="Attendees"
        type="number"
        min="1"
        max={seatsLeft === null ? "10" : String(Math.min(10, seatsLeft))}
        placeholder="1"
        help={seatsLeft === null ? undefined : text.field.seatsLeft.replace("{count}", String(seatsLeft))}
      />
      <Field label={text.field.eventNotes} name="Notes" textarea className="lg:col-span-2" />

      <div aria-hidden className="hidden">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <Turnstile onToken={onToken} />
        {error ? <p role="alert" className="t-base text-[#b42318]">{error}</p> : null}
        <button
          type="submit"
          disabled={!ready || busy}
          className={`inline-flex h-[57px] items-center justify-center rounded-full px-11 text-[16px] font-semibold leading-[20.8px] text-white transition-colors duration-300 md:h-[59px] md:text-[18px] md:leading-[23.4px] ${ready && !busy ? "bg-ink hover:bg-black" : "bg-black/30 backdrop-blur-[5px]"}`}
        >
          {busy ? text.sending : text.event.submit}
        </button>
      </div>
    </form>
  );
}
