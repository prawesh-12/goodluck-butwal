"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser } from "@/features/users/actions";
import { THIRD_ADMIN_PHRASE } from "@/lib/auth/user-rules";
import { EditorActionBar, SectionCard } from "@/components/shared/admin/editor-shell";
import { UnsavedGuard } from "@/components/shared/admin/unsaved-guard";
import { focusFirstError, useAction } from "@/components/shared/admin/use-action";
import { SelectField, SwitchField, TextField } from "@/components/shared/admin/fields";
import { ROLE_OPTIONS } from "@/features/users/components/roles";

export type UserValues = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  officeId: string;
  isActive: boolean;
  confirmation: string;
};

export function UserEditor({
  values,
  offices,
}: {
  values: UserValues;
  offices: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { busy, errors, run } = useAction();
  const [form, setForm] = useState(values);
  const [dirty, setDirty] = useState(false);
  const [needsPhrase, setNeedsPhrase] = useState(false);
  const isNew = values.id === "";

  const set = <K extends keyof UserValues>(key: K, value: UserValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  useEffect(() => focusFirstError(errors), [errors]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const shared = {
      name: form.name,
      role: form.role,
      officeId: form.officeId || null,
      confirmation: form.confirmation,
    };

    // Only the server knows how many admins are already active, so its refusal is what
    // reveals the phrase field.
    const refusal = { message: "" };
    const saved = await run(
      async () => {
        const result = isNew
          ? await createUser({ ...shared, email: form.email, password: form.password })
          : await updateUser({ ...shared, id: values.id, isActive: form.isActive });
        if (!result.ok) refusal.message = result.error;
        return result;
      },
      {
        success: isNew ? "User created" : "User saved",
        failure: isNew ? "Couldn't create this user." : "Couldn't save this user.",
      },
    );

    if (!saved) {
      setNeedsPhrase(refusal.message.includes(THIRD_ADMIN_PHRASE));
      return;
    }

    setNeedsPhrase(false);
    setDirty(false);
    if (isNew) router.push(`/admin/users/${saved.id}`);
    else router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <UnsavedGuard dirty={dirty} />

      <SectionCard title="Account">
        <TextField
          name="name"
          label="Name"
          required
          value={form.name}
          onChange={(value) => set("name", value)}
          error={errors.name?.[0]}
        />

        {isNew ? (
          <>
            <TextField
              name="email"
              label="Email"
              required
              type="email"
              help="They sign in with this and it cannot be changed afterwards."
              value={form.email}
              onChange={(value) => set("email", value)}
              error={errors.email?.[0]}
            />
            <TextField
              name="password"
              label="Password"
              required
              type="password"
              help="At least 12 characters. Tell them to change it once they are in."
              value={form.password}
              onChange={(value) => set("password", value)}
              error={errors.password?.[0]}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Signs in as {values.email}.</p>
        )}
      </SectionCard>

      <SectionCard title="Access">
        <SelectField
          name="role"
          label="Role"
          required
          help="An admin also manages users. A member with an office only sees that office's enquiries and content."
          value={form.role || "member"}
          onChange={(value) => set("role", value)}
          options={ROLE_OPTIONS}
          error={errors.role?.[0]}
        />
        <SelectField
          name="officeId"
          label="Office"
          value={form.officeId}
          onChange={(value) => set("officeId", value)}
          emptyLabel="All offices"
          options={offices.map((office) => ({ value: office.id, label: office.name }))}
          error={errors.officeId?.[0]}
        />

        {isNew ? null : (
          <SwitchField
            label="Can sign in"
            help="Turn this off and the account is signed out and locked out."
            checked={form.isActive}
            onChange={(checked) => set("isActive", checked)}
          />
        )}

        {needsPhrase ? (
          <TextField
            name="confirmation"
            label="Type the phrase to confirm"
            help={`Type "${THIRD_ADMIN_PHRASE}" to allow a third admin.`}
            value={form.confirmation}
            onChange={(value) => set("confirmation", value)}
          />
        ) : null}
      </SectionCard>

      <EditorActionBar dirty={dirty} busy={busy} saveLabel={isNew ? "Create user" : "Save"} />
    </form>
  );
}
