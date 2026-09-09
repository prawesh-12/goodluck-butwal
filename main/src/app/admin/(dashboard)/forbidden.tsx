import { EmptyState, ListHeader, NewButton } from "@/components/admin/list-ui";

export default function Forbidden() {
  return (
    <div className="space-y-4">
      <ListHeader title="Not your area" />
      <EmptyState>
        Your role does not cover this screen. If you need it, ask a super admin.
      </EmptyState>
      <NewButton href="/admin">Back to the dashboard</NewButton>
    </div>
  );
}
