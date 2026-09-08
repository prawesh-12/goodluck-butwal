import Link from "next/link";

export default function Forbidden() {
  return (
    <>
      <h1 className="t-h4">Not your area</h1>
      <p className="t-body admin-empty">
        Your role does not cover this screen. If you need it, ask a super admin.
      </p>
      <p className="admin-empty">
        <Link href="/admin" className="btn-black-sm">
          Back to the dashboard
        </Link>
      </p>
    </>
  );
}
