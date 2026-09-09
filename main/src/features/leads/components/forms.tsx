"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Field } from "@/components/shared/inner";
import { formatDate } from "@/lib/utils/datetime";
import { useOffice } from "@/features/offices/components/office";
import type { PublicOffice } from "@/features/offices/queries";
import type { PublicDestination } from "@/features/destinations/queries";
import type { PublicService } from "@/features/services/queries";
import type { FormText } from "@/features/site-text/form-text";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Turnstile } from "@/components/shared/turnstile";
import { trackFormSubmit } from "@/lib/integrations/analytics";

// The button stays translucent until the required fields are filled.
function SubmitButton({ label, ready, className = "" }: { label: string; ready: boolean; className?: string }) {
  return (
    <button type="submit" disabled={!ready} className={`inline-flex h-[57px] items-center justify-center rounded-full px-11 text-[16px] font-semibold leading-[20.8px] text-white transition-colors duration-300 md:h-[59px] md:text-[18px] md:leading-[23.4px] ${ready ? "bg-ink hover:bg-black" : "bg-black/30 backdrop-blur-[5px]"} ${className}`}>
      {label}
    </button>
  );
}

// The list is drawn in the page rather than by the operating system, so it matches the field it
// drops out of on every platform.
const TRIGGER = "flex h-[50px] w-full items-center justify-between gap-3 rounded-[10px] bg-white px-5 text-left text-[16px] font-medium text-ink outline-none ring-1 ring-inset ring-hairline focus-visible:ring-2 focus-visible:ring-ink/40";
const LIST = "fixed z-[60] max-h-[280px] overflow-y-auto rounded-[10px] bg-white p-[6px] text-[16px] font-medium text-ink shadow-[0_18px_40px_-12px_rgba(29,29,29,0.28)] ring-1 ring-hairline";
const OPTION = "cursor-pointer select-none rounded-[8px] px-4 py-[10px] leading-[22px] outline-none aria-selected:bg-surface aria-selected:text-ink data-[active]:bg-surface data-[active]:text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50";

export function Select({ label, name, options, placeholder, defaultValue = "", required, onChange }: { label: string; name: string; options: DropdownOption[]; placeholder?: string; defaultValue?: string; required?: boolean; onChange?: (value: string) => void }) {
  const id = `${name}-label`;
  return (
    <div className="flex flex-col items-start gap-[10px]">
      <span id={id} className="t-base text-muted">{label}</span>
      <Dropdown
        name={name}
        options={options}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        onChange={onChange}
        labelledBy={id}
        triggerClassName={TRIGGER}
        listClassName={LIST}
        optionClassName={OPTION}
      />
    </div>
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

function Intro({ lines }: { lines: string[] }) {
  const shown = lines.filter(Boolean);
  if (shown.length === 0) return null;
  return (
    <div className="flex w-full flex-col gap-[10px] lg:col-span-2">
      {shown.map((line) => <p key={line} className="t-base text-muted">{line}</p>)}
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

// What a form turns into once it has been sent: the confirmation sentence, then the answers read
// back so the visitor can see what actually reached us. No reference code, the email carries it.
function Sent({ message, rows, note }: { message: string; rows: [string, string][]; note?: string }) {
  const shown = rows.filter(([, value]) => value);
  return (
    <div className="flex w-full flex-col items-start gap-5">
      <p className="flex items-start gap-3 t-body text-ink">
        <span aria-hidden className="mt-[2px] flex size-6 shrink-0 items-center justify-center rounded-full bg-green/15">
          <svg viewBox="0 0 12 10" className="h-[8px] w-[10px]" aria-hidden>
            <path d="M1 5l3.5 3.5L11 1.5" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {message}
      </p>
      {shown.length > 0 && (
        <dl className="grid w-full gap-[10px] rounded-[10px] bg-white p-5 ring-1 ring-inset ring-hairline">
          {shown.map(([label, value]) => (
            <div key={label} className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="t-small text-muted">{label.replace(/\*$/, "")}</dt>
              <dd className="t-base font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {note ? <p className="t-small text-muted">{note}</p> : null}
    </div>
  );
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

export function EnquiryForm({ destinations, services, text }: { destinations: PublicDestination[]; services: PublicService[]; text: FormText }) {
  const { office } = useOffice();
  const { ready, check } = useReady(["Name", "Email", "Message"]);
  type Asked = { email: string; destination: string; service: string };
  const [sent, setSent] = useState<Asked | null>(null);
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
      serviceSlug: form.get("Service") || undefined,
      message: form.get("Message"),
      officeCode: office,
      company_website: form.get("company_website") || undefined,
      turnstileToken: token,
      ...context(),
    });
    setBusy(false);
    if (result.ok) {
      trackFormSubmit("enquiry", result.reference);
      setSent({
        email: String(form.get("Email") ?? ""),
        destination: destinations.find((d) => d.slug === form.get("Destination"))?.name ?? "",
        service: services.find((item) => item.slug === form.get("Service"))?.title ?? "",
      });
    } else {
      setError(result.error ?? text.error);
    }
  };

  if (sent)
    return (
      <Sent
        message={text.enquiry.success}
        rows={[
          [text.field.destination, sent.destination],
          [text.field.service, sent.service],
          [text.field.email, sent.email],
        ]}
      />
    );
  return (
    <form onSubmit={submit} onChange={(e) => check(e.currentTarget)} className="grid w-full gap-5 md:gap-[30px] lg:grid-cols-2">
      <Intro lines={[text.enquiry.intro, text.note]} />
      <Field label={text.field.name} name="Name" placeholder={text.field.nameHint} required />
      <Field label={text.field.email} name="Email" type="email" placeholder={text.field.emailHint} required />
      <Field label={text.field.phone} name="Phone" type="tel" placeholder={text.field.phoneHint} />
      <Field label={text.field.location} name="Location" placeholder={text.field.locationHint} />
      <Select
        label={text.field.destination}
        name="Destination"
        placeholder={text.field.destinationHint}
        options={destinations.map((d) => ({ value: d.slug, label: d.name }))}
      />
      <Select
        label={text.field.service}
        name="Service"
        placeholder={text.field.serviceHint}
        options={services.map((service) => ({ value: service.slug, label: service.title }))}
      />
      <Field label={text.field.message} name="Message" textarea placeholder={text.field.messageHint} className="lg:col-span-2" required />
      <Honeypot />
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Turnstile onToken={onToken} />
        {error ? <p role="alert" className="t-base text-[#b42318]">{error}</p> : null}
        <SubmitButton label={busy ? text.sending : text.enquiry.submit} ready={ready && !busy} />
      </div>
    </form>
  );
}

export function BookingForm({ offices, services, text }: { offices: PublicOffice[]; services: PublicService[]; text: FormText }) {
  const { office } = useOffice();
  const { ready, check } = useReady(["Name", "Email", "Phone", "Date", "Time", "Service"]);
  type Booked = { service: string; when: string; office: string };
  const [sent, setSent] = useState<Booked | null>(null);
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
    if (result.ok) {
      trackFormSubmit("booking", result.reference);
      const picked = offices.find((o) => o.id === form.get("Office"));
      const date = String(form.get("Date") ?? "");
      setSent({
        service: services.find((item) => item.slug === form.get("Service"))?.title ?? "",
        when: [date && formatDate(date), form.get("Time")].filter(Boolean).join(", "),
        office: picked ? `${picked.city}, ${picked.country}` : "",
      });
    } else {
      setError(result.error ?? text.error);
    }
  };

  if (sent)
    return (
      <Sent
        message={text.consultation.success}
        rows={[
          [text.field.serviceRequired, sent.service],
          [text.field.date, sent.when],
          [text.field.office, sent.office],
        ]}
        note={text.consultation.notHeld}
      />
    );

  return (
    <form onSubmit={submit} onChange={(e) => check(e.currentTarget)} className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
      <Intro lines={[text.consultation.intro, text.note]} />
      <Select
        label={text.field.office}
        name="Office"
        defaultValue={office}
        required
        onChange={(v) => setOfficeCode(v as typeof office)}
        options={offices.map((o) => ({ value: o.id, label: `${o.city}, ${o.country}` }))}
      />
      <Select
        label={text.field.serviceRequired}
        name="Service"
        required
        placeholder={text.field.serviceHint}
        options={services.map((service) => ({ value: service.slug, label: service.title }))}
      />
      <Field label={text.field.date} name="Date" type="date" required min={min} max={max} />
      <Field label={text.field.time} name="Time" type="time" required min="10:00" max="17:00" help={chosen?.hours} />
      <Field label={text.field.name} name="Name" placeholder={text.field.nameHint} required />
      <Field label={text.field.email} name="Email" type="email" placeholder={text.field.emailHint} required />
      <Field label={text.field.phoneRequired} name="Phone" type="tel" placeholder={text.field.phoneHint} required />
      <Select
        label={text.field.contactMethod}
        name="Contact"
        defaultValue="phone"
        options={[
          { value: "phone", label: text.field.contactPhone },
          { value: "email", label: text.field.contactEmail },
        ]}
      />
      <Field label={text.field.notes} name="Notes" textarea placeholder={text.field.notesHint} className="md:col-span-2" />
      <Honeypot />
      <div className="md:col-span-2 flex flex-col gap-4">
        <Turnstile onToken={onToken} />
        {error ? <p role="alert" className="t-base text-[#b42318]">{error}</p> : null}
        <SubmitButton label={busy ? text.sending : text.consultation.submit} ready={ready && !busy} />
      </div>
    </form>
  );
}
