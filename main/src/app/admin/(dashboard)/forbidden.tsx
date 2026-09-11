import { Lock } from "lucide-react";
import { NewButton } from "@/components/shared/admin/list-ui";
import { EmptyState } from "@/components/shared/admin/states";

export default function Forbidden() {
  return (
    <EmptyState
      icon={Lock}
      title="You don't have access to this"
      description="Your role does not cover this screen. Ask a super admin if you need it."
      action={<NewButton href="/admin">Back to the dashboard</NewButton>}
    />
  );
}
