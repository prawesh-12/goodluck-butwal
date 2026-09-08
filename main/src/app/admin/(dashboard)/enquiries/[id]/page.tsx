import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow, allowOwn } from "@/lib/guard";
import { formatInOfficeTz } from "@/lib/datetime";
import { getEnquiry } from "@/server/queries/leads";
import { EnquiryEditor } from "@/components/admin/enquiry-editor";

export const dynamic = "force-dynamic";

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "enquiries", "read");

  const row = await getEnquiry(actor, (await params).id);
  if (!row) notFound();
  allowOwn(actor, row);

  const facts: [string, string | null][] = [
    ["Reference", row.reference],
    ["Received", formatInOfficeTz(row.createdAt, "Australia/Melbourne")],
    ["Email", row.email],
    ["Phone", row.phone],
    ["Location", row.location],
    ["Office", row.office],
    ["Destination", row.destination],
    ["Service", row.service],
    ["Came from", row.sourcePage],
    ["Referrer", row.referrer],
    ["Campaign", row.utmCampaign],
    ["Campaign source", row.utmSource],
    ["Campaign medium", row.utmMedium],
  ];

  return (
    <>
      <h1 className="t-h4">{row.fullName}</h1>

      <dl className="admin-facts">
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="t-small">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>

      <h2 className="t-h5 admin-subhead">Message</h2>
      <p className="admin-message">{row.message}</p>

      <EnquiryEditor id={row.id} status={row.status} notes={row.internalNotes ?? ""} />
    </>
  );
}
