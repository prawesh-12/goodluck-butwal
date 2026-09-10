import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { formatInOfficeTz } from "@/lib/utils/datetime";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { StatusBadge } from "@/components/shared/admin/list-ui";
import { EnquiryEditor } from "@/features/leads/components/enquiry-editor";
import { getEnquiry } from "@/features/leads/queries";

export const dynamic = "force-dynamic";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">{children}</dd>
    </div>
  );
}

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  allow(actor, "enquiries", "read");

  const row = await getEnquiry(actor, (await params).id);
  if (!row) notFound();
  allowOwn(actor, row);

  const interest = [row.destination, row.service].filter(Boolean).join(" · ");
  const campaign = [row.utmCampaign, row.utmSource, row.utmMedium].filter(Boolean).join(" · ");
  const hasSource = Boolean(row.sourcePage || row.referrer || campaign);

  return (
    <>
      <EditorHeader
        backHref="/admin/enquiries"
        backLabel="Enquiries"
        title={row.fullName}
        meta={
          <>
            <StatusBadge status={row.status} />
            <span className="text-sm text-muted-foreground">Reference {row.reference}</span>
          </>
        }
      />

      <EditorLayout
        aside={<EnquiryEditor id={row.id} status={row.status} notes={row.internalNotes ?? ""} />}
      >
        <SectionCard title="Lead" contentClassName="space-y-4">
          <dl className="space-y-4">
            <Fact label="Contact">
              <a className="underline underline-offset-4" href={`mailto:${row.email}`}>
                {row.email}
              </a>
              {row.phone ? (
                <>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <a className="underline underline-offset-4" href={`tel:${row.phone.replace(/\s+/g, "")}`}>
                    {row.phone}
                  </a>
                </>
              ) : null}
            </Fact>
            <Fact label="Interest">{interest || <span className="text-muted-foreground">Not given</span>}</Fact>
            {row.location ? <Fact label="Living in">{row.location}</Fact> : null}
            {row.office ? <Fact label="Office">{row.office}</Fact> : null}
            <Fact label="Submitted">{formatInOfficeTz(row.createdAt, "Australia/Melbourne")}</Fact>
          </dl>
        </SectionCard>

        <SectionCard title="Message">
          {row.message ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{row.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">They did not leave a message.</p>
          )}
        </SectionCard>

        {hasSource ? (
          <SectionCard title="Where this came from" contentClassName="space-y-4">
            <dl className="space-y-4">
              {row.sourcePage ? <Fact label="Page used">{row.sourcePage}</Fact> : null}
              {row.referrer ? <Fact label="Arrived from">{row.referrer}</Fact> : null}
              {campaign ? <Fact label="Campaign">{campaign}</Fact> : null}
            </dl>
          </SectionCard>
        ) : null}
      </EditorLayout>
    </>
  );
}
