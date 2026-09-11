export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

export const roleLabel = (role: string) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
