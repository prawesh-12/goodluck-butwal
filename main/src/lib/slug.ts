export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Callers pass the slugs already in the table, so a new row never collides with an old one.
export function uniqueSlug(input: string, taken: Iterable<string>) {
  const base = slugify(input);
  const used = new Set(taken);
  if (!used.has(base)) return base;

  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
