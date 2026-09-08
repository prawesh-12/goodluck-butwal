"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Field } from "@/components/inner";
import { Turnstile } from "@/components/turnstile";
import { trackFormSubmit } from "@/lib/analytics";

export function RegistrationForm({
  eventId,
  closed,
  seatsLeft,
}: {
  eventId: string;
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

  if (done)
    return (
      <p className="t-body text-ink">
        You are registered. We have emailed you the details. Reply to that email if you can no
        longer make it.
      </p>
    );

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
    else setError(result.error ?? "That did not go through. Try again.");
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
      <Field label="Full name*" name="Name" placeholder="Your full name" required />
      <Field label="Email address*" name="Email" type="email" placeholder="you@example.com" required />
      <Field label="Phone number" name="Phone" type="tel" placeholder="Your contact number" />
      <Field
        label="How many are coming"
        name="Attendees"
        type="number"
        min="1"
        max={seatsLeft === null ? "10" : String(Math.min(10, seatsLeft))}
        placeholder="1"
        help={seatsLeft === null ? undefined : `${seatsLeft} seats left.`}
      />
      <Field label="Anything we should know" name="Notes" textarea className="lg:col-span-2" />

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
          {busy ? "Sending" : "Register"}
        </button>
      </div>
    </form>
  );
}
