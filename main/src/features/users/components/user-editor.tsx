"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser } from "@/features/users/actions";
import { THIRD_SUPER_ADMIN_PHRASE } from "@/lib/auth/user-rules";
import { Field } from "@/components/shared/admin/seo-section";
import { Select } from "@/components/shared/admin/repeater";

export type UserValues = {
  id: string;
  name: string;
  email: string;
  role: string;
  officeId: string;
  isActive: boolean;
};

const ROLES = [
  { value: "super_admin", label: "Super admin" },
  { value: "au_admin", label: "Australia admin" },
  { value: "np_admin", label: "Nepal admin" },
  { value: "content_editor", label: "Content editor" },
];

export function UserEditor({
  values,
  offices,
}: {
  values: UserValues;
  offices: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [needsPhrase, setNeedsPhrase] = useState(false);
  const isNew = values.id === "";

  return (
    <form
      className="admin-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const form = new FormData(event.currentTarget);
        const text = (key: string) => String(form.get(key) ?? "");
        const shared = {
          name: text("name"),
          role: text("role"),
          officeId: text("officeId") || null,
          confirmation: text("confirmation"),
        };

        const result = isNew
          ? await createUser({ ...shared, email: text("email"), password: text("password") })
          : await updateUser({ ...shared, id: values.id, isActive: form.get("isActive") === "on" });

        setBusy(false);
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        setMessage(result.ok ? "Saved." : result.error);
        setNeedsPhrase(!result.ok && result.error.includes(THIRD_SUPER_ADMIN_PHRASE));
        if (result.ok && isNew) router.push(`/admin/users/${result.data.id}`);
        else if (result.ok) router.refresh();
      }}
    >
      <Field name="name" label="Name" defaultValue={values.name} error={errors.name?.[0]} />

      {isNew ? (
        <>
          <Field name="email" label="Email" defaultValue="" error={errors.email?.[0]}
            help="They sign in with this and it cannot be changed afterwards." />
          <label className="admin-field">
            <span className="t-small">Password</span>
            <input name="password" type="password" autoComplete="new-password" />
            <span className="t-small admin-help">
              At least 12 characters. Tell them to change it once they are in.
            </span>
            {errors.password ? <span className="admin-clash">{errors.password[0]}</span> : null}
          </label>
        </>
      ) : (
        <p className="t-small admin-help">Signs in as {values.email}.</p>
      )}

      <Select
        label="Role"
        name="role"
        defaultValue={values.role || "content_editor"}
        error={errors.role?.[0]}
        help="An office admin only sees their own office's enquiries and content."
        options={ROLES}
      />

      <Select
        label="Office"
        name="officeId"
        defaultValue={values.officeId}
        help="Leave it on all offices for a super admin or an editor who works across both."
        options={[
          { value: "", label: "All offices" },
          ...offices.map((office) => ({ value: office.id, label: office.name })),
        ]}
      />

      {isNew ? null : (
        <label className="admin-field">
          <span className="t-small">
            <input type="checkbox" name="isActive" defaultChecked={values.isActive} /> Active
          </span>
          <span className="t-small admin-help">
            A deactivated account cannot sign in and is signed out of any session it has.
          </span>
        </label>
      )}

      {needsPhrase ? (
        <Field name="confirmation" label="Type the phrase to confirm" defaultValue=""
          help={`Type "${THIRD_SUPER_ADMIN_PHRASE}" to allow a third super admin.`} />
      ) : null}

      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
          {busy ? "Saving" : "Save"}
        </button>
        {message ? <span className="t-small">{message}</span> : null}
      </div>
    </form>
  );
}
