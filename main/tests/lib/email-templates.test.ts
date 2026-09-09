import { test, expect } from "vitest";
import {
  enquiryToStaff,
  enquiryToVisitor,
  consultationToStaff,
  consultationToVisitor,
  eventRegistered,
  eventRegisteredToStaff,
  testPrepToRegistrant,
  testPrepToStaff,
} from "@/lib/email/templates";

const office = { name: "Melbourne", addressLine1: "2 Queen St", phoneDisplay: "(03) 9466 4783" };

const enquiry = {
  reference: "ENQ-ABC123",
  fullName: "Sam Tan",
  email: "sam@example.com",
  phone: "+61390000000",
  location: "Melbourne",
  destination: "Australia",
  subject: "Visa Guidance",
  message: "I want to study nursing.",
};

const consultation = {
  reference: "CON-XYZ789",
  fullName: "Rita Gurung",
  email: "rita@example.com",
  phone: "+9779800000000",
  service: "Education Counselling",
  when: "Monday 12 October, 11:00",
  notes: "Prefers the Butwal office.",
  contactMethod: "phone",
};

const registration = {
  fullName: "Ajay Maharjan",
  email: "ajay@example.com",
  phone: "+9779812345678",
  course: "IELTS Coaching",
  batch: "October morning",
  starts: "2026-10-05",
  mode: "In person",
  notes: "Needs band 7.",
};

test("the enquiry sent to staff carries every field the visitor filled in", () => {
  const mail = enquiryToStaff(enquiry, office);

  expect(mail.subject).toContain("ENQ-ABC123");
  expect(mail.subject).toContain("Sam Tan");
  for (const value of ["sam@example.com", "+61390000000", "Melbourne", "Australia", "Visa Guidance", "I want to study nursing."]) {
    expect(mail.html).toContain(value);
  }
});

test("the enquiry sent back to the visitor quotes their reference and their own words", () => {
  const mail = enquiryToVisitor(enquiry, office);
  expect(mail.html).toContain("ENQ-ABC123");
  expect(mail.html).toContain("I want to study nursing.");
});

test("the consultation sent to staff carries the requested time and says nothing is booked", () => {
  const mail = consultationToStaff(consultation, office);
  expect(mail.html).toContain("Monday 12 October, 11:00");
  expect(mail.html).toContain("Education Counselling");
  expect(mail.html).toContain("Prefers the Butwal office.");
  expect(mail.html).toContain("Nothing is booked");
});

test("the consultation sent to the visitor repeats the time they asked for", () => {
  const mail = consultationToVisitor(consultation, office);
  expect(mail.html).toContain("CON-XYZ789");
  expect(mail.html).toContain("Monday 12 October, 11:00");
});

test("the event registrant is told what they signed up for", () => {
  const mail = eventRegistered({ fullName: "Sam Tan", event: "Open day", when: "Friday 3pm", where: "Melbourne" }, office);
  expect(mail.subject).toContain("Open day");
  expect(mail.html).toContain("Friday 3pm");
  expect(mail.html).toContain("Melbourne");
});

test("the event notice to staff carries who registered and how to reach them", () => {
  const mail = eventRegisteredToStaff(
    { fullName: "Sam Tan", event: "Open day", when: "Friday 3pm", where: "Melbourne", email: "sam@example.com", phone: "+61390000000", attendees: 2 },
    office,
  );
  expect(mail.subject).toContain("Sam Tan");
  expect(mail.html).toContain("sam@example.com");
  expect(mail.html).toContain("+61390000000");
  expect(mail.html).toContain("2");
});

test("the test prep registrant is told the course, batch and start", () => {
  const mail = testPrepToRegistrant(registration, office);
  expect(mail.subject).toContain("IELTS Coaching");
  expect(mail.html).toContain("October morning");
  expect(mail.html).toContain("2026-10-05");
  expect(mail.html).toContain("In person");
});

test("the test prep notice to staff carries the registrant and their notes", () => {
  const mail = testPrepToStaff(registration, office);
  expect(mail.subject).toContain("Ajay Maharjan");
  expect(mail.html).toContain("ajay@example.com");
  expect(mail.html).toContain("+9779812345678");
  expect(mail.html).toContain("Needs band 7.");
});

// Half of what these templates interpolate was typed into a public form.
test("markup typed into a form reaches the inbox as text, not as markup", () => {
  const attack = {
    ...enquiry,
    fullName: '<img src=x onerror="alert(1)">',
    message: "<script>steal()</script> and a <a href='http://evil'>link</a>",
  };
  const mail = enquiryToStaff(attack, office);

  expect(mail.html).not.toContain("<img");
  expect(mail.html).not.toContain("<script>");
  expect(mail.html).not.toContain("<a href");
  expect(mail.html).toContain("&lt;img");
  expect(mail.html).toContain("&lt;script&gt;");
});

test("no template leaks the api key or the from address into the body", () => {
  process.env.RESEND_API_KEY = "re_secret_value";
  const bodies = [
    enquiryToStaff(enquiry, office).html,
    enquiryToVisitor(enquiry, office).html,
    consultationToStaff(consultation, office).html,
    consultationToVisitor(consultation, office).html,
    testPrepToStaff(registration, office).html,
    testPrepToRegistrant(registration, office).html,
  ];
  for (const html of bodies) {
    expect(html).not.toContain("re_secret_value");
    expect(html).not.toContain("RESEND");
  }
  delete process.env.RESEND_API_KEY;
});
