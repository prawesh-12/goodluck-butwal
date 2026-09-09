type Office = { name: string; addressLine1: string | null; phoneDisplay: string | null };

// Everything below is built by string concatenation and half of it is typed by the public, so a
// name of "<img onerror=...>" would otherwise reach a staff inbox as markup.
const esc = (value?: string | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const shell = (body: string, office?: Office) => `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.5;color:#1d1d1d">
${body}
<hr style="border:none;border-top:1px solid #dde5ed;margin:24px 0">
<p style="font-size:13px;color:#4d585f">
Goodluck Education &amp; Migration${office ? `<br>${esc(office.name)}` : ""}${office?.addressLine1 ? `<br>${esc(office.addressLine1)}` : ""}${office?.phoneDisplay ? `<br>${esc(office.phoneDisplay)}` : ""}
</p>
</div>`.trim();

const row = (label: string, value?: string | null) =>
  value ? `<p style="margin:4px 0"><strong>${esc(label)}:</strong> ${esc(value)}</p>` : "";

export type EnquiryEmail = {
  reference: string;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  destination?: string | null;
  subject?: string | null;
  message: string;
  sourcePage?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
};

export const enquiryToStaff = (e: EnquiryEmail, office?: Office) => ({
  subject: `New enquiry ${e.reference} from ${e.fullName}`,
  html: shell(
    `<h2 style="font-size:18px;margin:0 0 12px">New enquiry ${esc(e.reference)}</h2>
${row("Name", e.fullName)}${row("Email", e.email)}${row("Phone", e.phone)}${row("Location", e.location)}
${row("Destination", e.destination)}${row("Subject", e.subject)}
<p style="margin:16px 0 4px"><strong>Message</strong></p>
<p style="margin:0;white-space:pre-wrap">${esc(e.message)}</p>
${row("Came from", e.sourcePage)}${row("Campaign", e.utm?.campaign)}${row("Source", e.utm?.source)}${row("Medium", e.utm?.medium)}`,
    office,
  ),
});

export const enquiryToVisitor = (e: EnquiryEmail, office?: Office) => ({
  subject: `We have your enquiry, ${e.fullName}`,
  html: shell(
    `<p>Thanks for getting in touch. Your reference is <strong>${esc(e.reference)}</strong>.</p>
<p>A counsellor will read this and reply. Quote the reference if you contact us before then.</p>
<p style="margin:16px 0 4px"><strong>What you sent us</strong></p>
<p style="margin:0;white-space:pre-wrap;color:#4d585f">${esc(e.message)}</p>`,
    office,
  ),
});

export type ConsultationEmail = {
  reference: string;
  fullName: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  when: string;
  notes?: string | null;
  contactMethod?: string | null;
};

export const consultationToStaff = (c: ConsultationEmail, office?: Office) => ({
  subject: `Consultation request ${c.reference} from ${c.fullName}`,
  html: shell(
    `<h2 style="font-size:18px;margin:0 0 12px">Consultation request ${esc(c.reference)}</h2>
${row("Name", c.fullName)}${row("Email", c.email)}${row("Phone", c.phone)}
${row("Service", c.service)}${row("Asked for", c.when)}${row("Prefers", c.contactMethod)}
${c.notes ? `<p style="margin:16px 0 4px"><strong>Notes</strong></p><p style="margin:0;white-space:pre-wrap">${esc(c.notes)}</p>` : ""}
<p style="margin-top:16px;color:#4d585f">Nothing is booked. Confirm it in the admin to send the confirmation.</p>`,
    office,
  ),
});

export const consultationToVisitor = (c: ConsultationEmail, office?: Office) => ({
  subject: `Request received, ${c.fullName}`,
  html: shell(
    `<p>Request received. We will confirm by email within one business day.</p>
<p>Your reference is <strong>${esc(c.reference)}</strong>. You asked for <strong>${esc(c.when)}</strong>.</p>
<p style="color:#4d585f">That time is not held until we confirm it.</p>`,
    office,
  ),
});

export const consultationConfirmed = (c: ConsultationEmail, office?: Office) => ({
  subject: `Your consultation is confirmed for ${c.when}`,
  html: shell(
    `<p>Your consultation is confirmed.</p>
${row("When", c.when)}${row("Where", office?.name)}${row("Reference", c.reference)}
<p>If you need to change it, reply to this email and quote the reference.</p>`,
    office,
  ),
});

export type EventEmail = { fullName: string; event: string; when: string; where: string };

export const eventRegistered = (e: EventEmail, office?: Office) => ({
  subject: `You are registered for ${e.event}`,
  html: shell(
    `<p>You are registered for <strong>${esc(e.event)}</strong>.</p>
${row("When", e.when)}${row("Where", e.where)}
<p>Reply to this email if you can no longer make it.</p>`,
    office,
  ),
});

export const eventRegisteredToStaff = (e: EventEmail & { email: string; phone?: string | null; attendees?: number }, office?: Office) => ({
  subject: `Event registration: ${e.fullName} for ${e.event}`,
  html: shell(
    `<h2 style="font-size:18px;margin:0 0 12px">New event registration</h2>
${row("Event", e.event)}${row("Name", e.fullName)}${row("Email", e.email)}${row("Phone", e.phone)}
${row("Attendees", e.attendees ? String(e.attendees) : null)}${row("When", e.when)}${row("Where", e.where)}`,
    office,
  ),
});

export type TestPrepEmail = {
  fullName: string;
  email: string;
  phone?: string | null;
  course: string;
  batch: string;
  starts: string;
  mode?: string | null;
  notes?: string | null;
};

export const testPrepToStaff = (r: TestPrepEmail, office?: Office) => ({
  subject: `${r.course} registration: ${r.fullName} for ${r.batch}`,
  html: shell(
    `<h2 style="font-size:18px;margin:0 0 12px">New test preparation registration</h2>
${row("Course", r.course)}${row("Batch", r.batch)}${row("Starts", r.starts)}${row("Mode", r.mode)}
${row("Name", r.fullName)}${row("Email", r.email)}${row("Phone", r.phone)}
${r.notes ? `<p style="margin:16px 0 4px"><strong>Notes</strong></p><p style="margin:0;white-space:pre-wrap">${esc(r.notes)}</p>` : ""}`,
    office,
  ),
});

export const testPrepToRegistrant = (r: TestPrepEmail, office?: Office) => ({
  subject: `You are registered for ${r.course}`,
  html: shell(
    `<p>You have a seat on <strong>${esc(r.course)}</strong>.</p>
${row("Batch", r.batch)}${row("Starts", r.starts)}${row("Mode", r.mode)}
<p>We will be in touch before the first class. Reply to this email if you can no longer attend.</p>`,
    office,
  ),
});
