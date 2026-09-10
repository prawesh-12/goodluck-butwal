export function Field({
  name,
  label,
  help,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  help?: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <label className="admin-field">
      <span className="t-small">{label}</span>
      <input name={name} defaultValue={defaultValue} />
      {help ? <span className="t-small admin-help">{help}</span> : null}
      {error ? <span className="admin-clash">{error}</span> : null}
    </label>
  );
}
