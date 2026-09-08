"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Field } from "@/components/inner";
import { useOffice } from "@/components/office";
import { enquirySubjects } from "@/lib/site";
import type { PublicOffice } from "@/server/queries/offices";
import type { PublicDestination } from "@/server/queries/destinations";
import type { PublicService } from "@/server/queries/services";
import { Turnstile } from "@/components/turnstile";

// The button stays translucent until the required fields are filled.
function SubmitButton({ label, ready, className = "" }: { label: string; ready: boolean; className?: string }) {
  return (
    <button type="submit" disabled={!ready} className={`inline-flex h-[57px] items-center justify-center rounded-full px-11 text-[16px] font-semibold leading-[20.8px] text-white transition-colors duration-300 md:h-[59px] md:text-[18px] md:leading-[23.4px] ${ready ? "bg-ink hover:bg-black" : "bg-black/30 backdrop-blur-[5px]"} ${className}`}>
      {label}
    </button>
  );
}

const selectClass = "h-[50px] w-full appearance-none rounded-[10px] bg-white px-5 text-[16px] font-medium text-ink outline-none ring-1 ring-inset ring-hairline focus:ring-ink/40";

export function Select({ label, name, children, defaultValue = "", required, onChange }: { label: string; name: string; children: React.ReactNode; defaultValue?: string; required?: boolean; onChange?: (value: string) => void }) {
  return (
    <label className="flex flex-col items-start gap-[10px]">
      <span className="t-base text-muted">{label}</span>
      <span className="relative w-full">
        <select name={name} defaultValue={defaultValue} required={required} onChange={(e) => onChange?.(e.currentTarget.value)} className={selectClass}>
          {children}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-5 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-muted" />
      </span>
    </label>
  );
}

function useReady(required: string[]) {
  const [ready, setReady] = useState(false);
  const check = (form: HTMLFormElement) => setReady(required.every((n) => (form.elements.namedItem(n) as HTMLInputElement)?.value.trim()));
  return { ready, check };
}

// Bots fill every field they find. This one is invisible and never focusable, so a value in it
// only ever came from a script.
function Honeypot() {
  return (
    <div aria-hidden className="hidden">
      <label>
        Company website
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

// Where the visitor was and how they got there, so a lead can be traced back to a campaign.
function context() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    sourcePage: window.location.pathname,
    referrer: document.referrer || undefined,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
}

async function post(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { ok: boolean; reference?: string; error?: string };
}

// The date picker never offers today or anything past two months out.
function dateRange() {
  const from = new Date();
  from.setDate(from.getDate() + 1);
  const to = new Date();
  to.setDate(to.getDate() + 60);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { min: iso(from), max: iso(to) };
}

export function EnquiryForm({ destinations }: { destinations: PublicDestination[] }) {
  const { office } = useOffice();
  const { ready, check } = useReady(["Name", "Email", "Message"]);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const onToken = useCallback((t: string) => setToken(t), []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await post("/api/enquiries", {
      fullName: form.get("Name"),
      email: form.get("Email"),
      phone: form.get("Phone") || undefined,
      currentLocation: form.get("Location") || undefined,
      destinationSlug: form.get("Destination") || undefined,
      subject: form.get("Subject") || undefined,
      message: form.get("Message"),
      officeCode: office,
      company_website: form.get("company_website") || undefined,
      turnstileToken: token,
      ...context(),
    });
    setBusy(false);
    if (result.ok) setSent(result.reference ?? "");
    else setError(result.error ?? "That did not go through. Try again.");
  };

  if (sent)
    return (
      <p className="t-body text-ink">
        Thanks, we have your enquiry. A counsellor will get back to you.
        {sent ? <> Your reference is <strong>{sent}</strong>.</> : null}
      </p>
    );
  return (
    <form onSubmit={submit} onChange={(e) => check(e.currentTarget)} className="grid w-full gap-5 md:gap-[30px] lg:grid-cols-2">
      <Field label="Full name*" name="Name" placeholder="Your full name" required />
      <Field label="Email address*" name="Email" type="email" placeholder="you@example.com" required />
      <Field label="Phone number" name="Phone" type="tel" placeholder="Your contact number" />
      <Field label="Current location" name="Location" placeholder="City, country" />
      <Select label="Interested destination" name="Destination">
        <option value="">Choose a destination</option>
        {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
      </Select>
      <Select label="Interested service" name="Subject">
        <option value="">Choose a service</option>
        {enquirySubjects.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Field label="Message*" name="Message" textarea placeholder="How can we help?" className="lg:col-span-2" required />
      <Honeypot />
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Turnstile onToken={onToken} />
        {error ? <p role="alert" className="t-base text-[#b42318]">{error}</p> : null}
        <SubmitButton label={busy ? "Sending" : "Submit now"} ready={ready && !busy} />
      </div>
    </form>
  );
}

export function BookingForm({ offices, services }: { offices: PublicOffice[]; services: PublicService[] }) {
  const { office } = useOffice();
  const { ready, check } = useReady(["Name", "Email", "Phone", "Date", "Time", "Service"]);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [officeCode, setOfficeCode] = useState(office);
  const onToken = useCallback((t: string) => setToken(t), []);
  const { min, max } = dateRange();
  const chosen = offices.find((o) => o.id === officeCode);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await post("/api/consultations", {
      fullName: form.get("Name"),
      email: form.get("Email"),
      phone: form.get("Phone"),
      officeCode: form.get("Office"),
      serviceSlug: form.get("Service"),
      preferredDate: form.get("Date"),
      preferredTime: form.get("Time"),
      preferredContactMethod: form.get("Contact"),
      notes: form.get("Notes") || undefined,
      company_website: form.get("company_website") || undefined,
      turnstileToken: token,
      ...context(),
    });
    setBusy(false);
    if (result.ok) setSent(result.reference ?? "");
    else setError(result.error ?? "That did not go through. Try again.");
  };

  if (sent)
    return (
      <p className="t-body text-ink">
        Request received. We will confirm by email within one business day.
        {sent ? <> Your reference is <strong>{sent}</strong>.</> : null}
      </p>
    );
  return (
    <form onSubmit={submit} onChange={(e) => check(e.currentTarget)} className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
      <Select label="Office*" name="Office" defaultValue={office} required onChange={(v) => setOfficeCode(v as typeof office)}>
        {offices.map((o) => <option key={o.id} value={o.id}>{o.city}, {o.country}</option>)}
      </Select>
      <Select label="Service*" name="Service" required>
        <option value="">Choose a service</option>
        {services.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
      </Select>
      <Field label="Preferred date*" name="Date" type="date" required min={min} max={max} />
      <Field label="Preferred time*" name="Time" type="time" required min="10:00" max="17:00" help={chosen?.hours} />
      <Field label="Full name*" name="Name" placeholder="Your full name" required />
      <Field label="Email address*" name="Email" type="email" placeholder="you@example.com" required />
      <Field label="Phone number*" name="Phone" type="tel" placeholder="Your contact number" required />
      <Select label="Preferred contact method" name="Contact" defaultValue="phone">
        <option value="phone">Phone</option>
        <option value="email">Email</option>
      </Select>
      <Field label="Additional notes" name="Notes" textarea placeholder="Anything we should know before we meet?" className="md:col-span-2" />
      <Honeypot />
      <div className="md:col-span-2 flex flex-col gap-4">
        <Turnstile onToken={onToken} />
        {error ? <p role="alert" className="t-base text-[#b42318]">{error}</p> : null}
        <SubmitButton label={busy ? "Sending" : "Book appointment"} ready={ready && !busy} />
      </div>
    </form>
  );
}
