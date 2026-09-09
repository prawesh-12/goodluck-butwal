import { loadText } from "@/features/site-text/queries";

// Every form label, placeholder, button and message in one object. The forms are client
// components, so their wording has to arrive as a prop rather than be read where it is used.
export type FormText = {
  note: string;
  error: string;
  sending: string;
  reference: string;
  field: {
    name: string;
    nameHint: string;
    email: string;
    emailHint: string;
    phone: string;
    phoneRequired: string;
    phoneHint: string;
    location: string;
    locationHint: string;
    destination: string;
    destinationHint: string;
    service: string;
    serviceRequired: string;
    serviceHint: string;
    message: string;
    messageHint: string;
    office: string;
    date: string;
    time: string;
    contactMethod: string;
    contactPhone: string;
    contactEmail: string;
    notes: string;
    notesHint: string;
    attendees: string;
    eventNotes: string;
    seatsLeft: string;
  };
  enquiry: { intro: string; success: string; submit: string };
  consultation: { intro: string; success: string; submit: string; notHeld: string };
  event: { success: string; submit: string };
};

export async function formText(): Promise<FormText> {
  const t = await loadText();
  return {
    // Blank by default. The approved forms carry no note or intro, so nothing renders until an
    // admin writes one.
    note: t("forms.required_note", ""),
    error: t("forms.error", "That did not go through. Try again."),
    sending: t("forms.sending", "Sending"),
    reference: t("forms.reference", "Your reference is"),
    field: {
      name: t("forms.field.name", "Full name*"),
      nameHint: t("forms.field.name_hint", "Your full name"),
      email: t("forms.field.email", "Email address*"),
      emailHint: t("forms.field.email_hint", "you@example.com"),
      phone: t("forms.field.phone", "Phone number"),
      phoneRequired: t("forms.field.phone_required", "Phone number*"),
      phoneHint: t("forms.field.phone_hint", "Your contact number"),
      location: t("forms.field.location", "Current location"),
      locationHint: t("forms.field.location_hint", "City, country"),
      destination: t("forms.field.destination", "Interested destination"),
      destinationHint: t("forms.field.destination_hint", "Choose a destination"),
      service: t("forms.field.service", "Interested service"),
      serviceRequired: t("forms.field.service_required", "Service*"),
      serviceHint: t("forms.field.service_hint", "Choose a service"),
      message: t("forms.field.message", "Message*"),
      messageHint: t("forms.field.message_hint", "How can we help?"),
      office: t("forms.field.office", "Office*"),
      date: t("forms.field.date", "Preferred date*"),
      time: t("forms.field.time", "Preferred time*"),
      contactMethod: t("forms.field.contact_method", "Preferred contact method"),
      contactPhone: t("forms.field.contact_phone", "Phone"),
      contactEmail: t("forms.field.contact_email", "Email"),
      notes: t("forms.field.notes", "Additional notes"),
      notesHint: t("forms.field.notes_hint", "Anything we should know before we meet?"),
      attendees: t("forms.field.attendees", "How many are coming"),
      eventNotes: t("forms.field.event_notes", "Anything we should know"),
      seatsLeft: t("forms.field.seats_left", "{count} seats left."),
    },
    enquiry: {
      intro: t("forms.enquiry.intro", ""),
      success: t("forms.enquiry.success", "Thanks, we have your enquiry. A counsellor will get back to you."),
      submit: t("forms.enquiry.submit", "Submit now"),
    },
    consultation: {
      intro: t("forms.consultation.intro", ""),
      success: t("forms.consultation.success", "Request received. We will confirm by email within one business day."),
      submit: t("forms.consultation.submit", "Book appointment"),
      notHeld: t("forms.consultation.not_held", "That time is not held until we confirm it."),
    },
    event: {
      success: t("forms.event.success", "You are registered. We have emailed you the details. Reply to that email if you can no longer make it."),
      submit: t("forms.event.submit", "Register"),
    },
  };
}
