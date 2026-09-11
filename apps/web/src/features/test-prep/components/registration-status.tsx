"use client";

import { useRouter } from "next/navigation";
import { useAction } from "@/components/shared/admin/use-action";
import { statusLabel } from "@/components/shared/admin/list-ui";
import { updateRegistration } from "@/features/test-prep/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/admin/select";

const STATUSES = ["registered", "attended", "cancelled"];

export function RegistrationStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const { busy, run } = useAction();

  return (
    <Select
      value={status}
      disabled={busy}
      onValueChange={async (next) => {
        const saved = await run(() => updateRegistration({ id, status: next }), {
          success: "Registration updated",
          failure: "Couldn't update the registration.",
        });
        if (saved) router.refresh();
      }}
    >
      <SelectTrigger size="sm" className="w-36" aria-label="Registration status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((option) => (
          <SelectItem key={option} value={option}>
            {statusLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
