export const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super admin" },
  { value: "au_admin", label: "Australia admin" },
  { value: "np_admin", label: "Nepal admin" },
  { value: "content_editor", label: "Content editor" },
];

export const roleLabel = (role: string) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
