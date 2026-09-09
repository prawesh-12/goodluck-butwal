import { requireActor } from "@/lib/session";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";

export const dynamic = "force-dynamic";

const WHERE: [string, string, string][] = [
  ["A heading or button label anywhere", "Site text", "Any admin"],
  ["A phone number, address, hours or map", "Offices", "Own office"],
  ["Add a staff member, change a bio or photo", "Team", "Own office"],
  ["Text on a destination page", "Destinations", "Australia or Nepal admin"],
  ["Add an FAQ question", "Destinations or Services, then FAQs", "Australia or Nepal admin"],
  ["A service description or its steps", "Services", "Australia or Nepal admin"],
  ["Add a partner logo to the ticker", "Partners", "Australia or Nepal admin"],
  ["Add an institution or its gallery", "Institutions", "Australia or Nepal admin"],
  ["Add courses, or many at once", "Courses, or Courses then Import", "Australia or Nepal admin"],
  ["Add an IELTS or PTE batch, change fees or seats", "Test prep, then Batches", "Nepal admin"],
  ["Publish a news article", "Posts", "Any admin; editors draft only"],
  ["Schedule an article for later", "Posts, status Scheduled", "Any admin"],
  ["Add an event and open registrations", "Events", "Own office"],
  ["See who registered", "Events, then Registrations", "Own office"],
  ["Add a success story or video testimonial", "Testimonials", "Australia or Nepal admin"],
  ["Hide a student's name", "Testimonials, Anonymise", "Australia or Nepal admin"],
  ["See and respond to enquiries", "Enquiries", "Own office"],
  ["Confirm a consultation", "Consultations, then Confirm", "Own office"],
  ["Download enquiries as a spreadsheet", "Enquiries, then Export", "Own office"],
  ["The page title Google shows", "That record's SEO section", "Record owner"],
  ["Which address gets enquiry notifications", "Settings, Notifications", "Super admin"],
  ["The announcement bar, social links, Google rating", "Settings", "Super admin"],
  ["Add a staff login or change a role", "Users", "Super admin"],
  ["Send an old web address to a new page", "Redirects", "Super admin"],
  ["See who changed what", "Audit log", "Any admin"],
];

const WHO: [string, string][] = [
  ["Business owner, or one senior manager", "Super admin"],
  ["One trusted backup, such as the operations lead", "Super admin"],
  ["Australia office manager or senior counsellor", "Australia administrator"],
  ["Nepal office manager or senior counsellor", "Nepal administrator"],
  ["Marketing or communications staff", "Content editor"],
  [
    "Counsellors who only need their own bookings",
    "No account. They get the notification emails instead. Handing out logins is how enquiry data leaks.",
  ],
  [
    "Developer or agency after the warranty ends",
    "No account. Turn one back on for a specific job, then deactivate it.",
  ],
  ["Intern or contractor", "Content editor, deactivated on their last day"],
];

export default async function HelpPage() {
  await requireActor();

  return (
    <>
      <h1 className="t-h4">Help</h1>

      <h2 className="t-h6">Where to change what</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>I want to change...</TableHead>
            <TableHead>Go to</TableHead>
            <TableHead>Who can do it</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WHERE.map(([want, where, role]) => (
            <TableRow key={want}>
              <TableCell>{want}</TableCell>
              <TableCell>{where}</TableCell>
              <TableCell>{role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2 className="t-h6">Who gets access</h2>
      <p className="t-body">Give the smallest role that does the job.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Person</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WHO.map(([person, role]) => (
            <TableRow key={person}>
              <TableCell>{person}</TableCell>
              <TableCell>{role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2 className="t-h6">Rules the site enforces for you</h2>
      <ul className="t-body">
        <li>At most two super admins, and never fewer than one.</li>
        <li>Nobody can change their own role or switch off their own account.</li>
        <li>
          One account per person. Shared logins are not allowed, because the audit log is
          worthless the moment two people use one login.
        </li>
      </ul>

      <h2 className="t-h6">When someone joins or leaves</h2>
      <ul className="t-body">
        <li>Joining: give the smallest useful role and the correct office.</li>
        <li>Never rename an old account for a new person. Make a new one.</li>
        <li>
          Leaving: deactivate the account the same day. Never delete it, because deleting breaks
          the audit trail and orphans their work.
        </li>
        <li>If the person leaving was a super admin, change any shared passwords as well.</li>
        <li>
          Every six months, open Users and ask of each account, does this person still need this?
          Deactivate anything you hesitate over.
        </li>
      </ul>

      <h2 className="t-h6">Previewing a draft</h2>
      <p className="t-body">
        A draft article can be viewed at /preview/post/ followed by its web address. Only
        signed-in staff can open it, and search engines are told to ignore it.
      </p>
    </>
  );
}
