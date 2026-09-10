"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/shared/admin/confirm-dialog";
import { FlatBadge, StatusBadge } from "@/components/shared/admin/list-ui";
import { useAction } from "@/components/shared/admin/use-action";
import { Button } from "@/components/ui/admin/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/admin/sheet";
import { confirmConsultation } from "@/features/leads/actions";
import { dateLabel, timeLabel } from "@/features/leads/components/lead-format";
import type { listConsultations } from "@/features/leads/queries";

export type Consultation = Awaited<ReturnType<typeof listConsultations>>["rows"][number];

const CONTACT_METHOD: Record<string, string> = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
};

export function ConfirmConsultation({ row, className }: { row: Consultation; className?: string }) {
  const router = useRouter();
  const { busy, run } = useAction();

  // Confirming emails the person their appointment, so it asks first. The action answers with no
  // payload, so the call is wrapped in the shape useAction expects.
  const confirm = async () => {
    const done = await run(
      async () => {
        const result = await confirmConsultation({ id: row.id });
        return result.ok ? { ok: true as const, data: true as const } : result;
      },
      { success: "Consultation confirmed", failure: "Couldn't confirm the consultation." },
    );
    if (done) router.refresh();
  };

  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" disabled={busy} className={className}>
          Confirm
        </Button>
      }
      title="Confirm this consultation?"
      description={
        <p>
          {row.fullName} gets an email saying the appointment is set for {dateLabel(row.preferredDate)} at{" "}
          {timeLabel(row.preferredTime)}
          {row.office ? ` at ${row.office}` : ""}.
        </p>
      }
      confirmLabel="Confirm and email"
      destructive={false}
      onConfirm={confirm}
    />
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">{children}</dd>
    </div>
  );
}

export function ConsultationDetails({ row }: { row: Consultation }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          View
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{row.fullName}</SheetTitle>
          <SheetDescription>Reference {row.reference}</SheetDescription>
          <div className="pt-1">
            <StatusBadge status={row.status} />
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <dl className="space-y-4">
            <Fact label="Preferred date">{dateLabel(row.preferredDate)}</Fact>
            <Fact label="Preferred time">{timeLabel(row.preferredTime)}</Fact>
            <Fact label="Office">{row.office ?? "Not set"}</Fact>
            <Fact label="Service">{row.service ?? "Not set"}</Fact>
          </dl>

          {row.clashes ? <FlatBadge variant="warning">Another request wants this slot</FlatBadge> : null}

          <dl className="space-y-4">
            <Fact label="Email">
              <a className="underline underline-offset-4" href={`mailto:${row.email}`}>
                {row.email}
              </a>
            </Fact>
            {row.phone ? (
              <Fact label="Phone">
                <a className="underline underline-offset-4" href={`tel:${row.phone.replace(/\s+/g, "")}`}>
                  {row.phone}
                </a>
              </Fact>
            ) : null}
            {row.contactMethod ? (
              <Fact label="Prefers">{CONTACT_METHOD[row.contactMethod] ?? row.contactMethod}</Fact>
            ) : null}
          </dl>

          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Notes</p>
            {row.notes ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{row.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">They did not leave any notes.</p>
            )}
          </div>

          {row.status === "pending" ? <ConfirmConsultation row={row} className="w-full" /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
