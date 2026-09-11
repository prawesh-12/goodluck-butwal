import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { formatInOfficeTz } from "@/lib/utils/datetime";
import { EditorHeader } from "@/components/shared/admin/page-header";
import { EditorLayout, SectionCard } from "@/components/shared/admin/editor-shell";
import { Muted, StatusBadge } from "@/components/shared/admin/list-ui";
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

  const campaign = [row.utmCampaign, row.utmSource, row.utmMedium].filter(Boolean).join(" · ");
  const submitted = formatInOfficeTz(row.createdAt, "Australia/Melbourne");

  return (
    <>
      <EditorHeader
        backHref="/admin/enquiries"
        backLabel="Enquiries"
        title={row.fullName}
        meta={
          <>
            <StatusBadge status={row.status} />
            <span className="text-sm text-muted-foreground">Received {submitted}</span>
          </>
        }
      />

      <EditorLayout
        aside={<EnquiryEditor id={row.id} status={row.status} notes={row.internalNotes ?? ""} />}
      >
        <SectionCard title="Contact">
          <dl className="space-y-4">
            <Fact label="Email">
              <a className="underline underline-offset-4" href={`mailto:${row.email}`}>
                {row.email}
              </a>
            </Fact>
            <Fact label="Phone">
              {row.phone ? (
                <a className="underline underline-offset-4" href={`tel:${row.phone.replace(/\s+/g, "")}`}>
                  {row.phone}
                </a>
              ) : (
                <Muted>Not given</Muted>
              )}
            </Fact>
            {row.location ? <Fact label="Living in">{row.location}</Fact> : null}
          </dl>
        </SectionCard>

        <SectionCard title="Interest">
          <dl className="space-y-4">
            <Fact label="Destination">{row.destination ?? <Muted>Not given</Muted>}</Fact>
            <Fact label="Service">{row.service ?? <Muted>Not given</Muted>}</Fact>
          </dl>
        </SectionCard>

        <SectionCard title="Message">
          {row.message ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{row.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">They did not leave a message.</p>
          )}
        </SectionCard>

        <SectionCard title="Submission details">
          <dl className="space-y-4">
            <Fact label="Reference">{row.reference}</Fact>
            <Fact label="Received">{submitted}</Fact>
            <Fact label="Office">{row.office ?? <Muted>Not set</Muted>}</Fact>
            {row.sourcePage ? <Fact label="Page used">{row.sourcePage}</Fact> : null}
            {row.referrer ? <Fact label="Arrived from">{row.referrer}</Fact> : null}
            {campaign ? <Fact label="Campaign">{campaign}</Fact> : null}
          </dl>
        </SectionCard>
      </EditorLayout>
    </>
  );
}
