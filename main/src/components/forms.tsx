"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/inner";
import { useOffice } from "@/components/office";
import { enquirySubjects } from "@/lib/site";
import type { PublicOffice } from "@/server/queries/offices";
import type { PublicDestination } from "@/server/queries/destinations";
import type { PublicService } from "@/server/queries/services";

// UI only: nothing is sent anywhere yet. The button stays translucent until the required fields are filled.
function SubmitButton({ label, ready, className = "" }: { label: string; ready: boolean; className?: string }) {
  return (
    <button type="submit" disabled={!ready} className={`inline-flex h-[57px] items-center justify-center rounded-full px-11 text-[16px] font-semibold leading-[20.8px] text-white transition-colors duration-300 md:h-[59px] md:text-[18px] md:leading-[23.4px] ${ready ? "bg-ink hover:bg-black" : "bg-black/30 backdrop-blur-[5px]"} ${className}`}>
      {label}
    </button>
  );
}

const selectClass = "h-[50px] w-full appearance-none rounded-[10px] bg-white px-5 text-[16px] font-medium text-ink outline-none ring-1 ring-inset ring-hairline focus:ring-ink/40";

export function Select({ label, name, children, defaultValue = "", required }: { label: string; name: string; children: React.ReactNode; defaultValue?: string; required?: boolean }) {
  return (
    <label className="flex flex-col items-start gap-[10px]">
      <span className="t-base text-muted">{label}</span>
      <span className="relative w-full">
        <select name={name} defaultValue={defaultValue} required={required} className={selectClass}>
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

export function EnquiryForm({ destinations }: { destinations: PublicDestination[] }) {
  const { ready, check } = useReady(["Name", "Email", "Message"]);
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setSent(true); };
  if (sent) return <p className="t-body text-ink">Thanks, we have your enquiry. A counsellor will get back to you.</p>;
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
      <div className="lg:col-span-2"><SubmitButton label="Submit now" ready={ready} /></div>
    </form>
  );
}

export function BookingForm({ offices, services }: { offices: PublicOffice[]; services: PublicService[] }) {
  const { office } = useOffice();
  const { ready, check } = useReady(["Name", "Email", "Phone", "Date", "Time", "Service"]);
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setSent(true); };
  if (sent) return <p className="t-body text-ink">Request received. We will confirm your appointment time by email or phone.</p>;
  return (
    <form onSubmit={submit} onChange={(e) => check(e.currentTarget)} className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px]">
      <Select label="Office*" name="Office" defaultValue={office} required>
        {offices.map((o) => <option key={o.id} value={o.id}>{o.city}, {o.country}</option>)}
      </Select>
      <Select label="Service*" name="Service" required>
        <option value="">Choose a service</option>
        {services.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
      </Select>
      <Field label="Preferred date*" name="Date" type="date" required />
      <Field label="Preferred time*" name="Time" type="time" required />
      <Field label="Full name*" name="Name" placeholder="Your full name" required />
      <Field label="Email address*" name="Email" type="email" placeholder="you@example.com" required />
      <Field label="Phone number*" name="Phone" type="tel" placeholder="Your contact number" required />
      <Select label="Preferred contact method" name="Contact" defaultValue="phone">
        <option value="phone">Phone</option>
        <option value="email">Email</option>
      </Select>
      <Field label="Additional notes" name="Notes" textarea placeholder="Anything we should know before we meet?" className="md:col-span-2" />
      <div className="md:col-span-2"><SubmitButton label="Book appointment" ready={ready} /></div>
    </form>
  );
}
