import { FlatButton } from "@/components/ui/button";

export function Pager({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex w-full flex-wrap items-center justify-center gap-5">
      {page > 1 && <FlatButton href={hrefFor(page - 1)} tone="dark">Previous</FlatButton>}
      <p className="t-base text-muted">Page {page} of {pages}</p>
      {page < pages && <FlatButton href={hrefFor(page + 1)} tone="dark">Next</FlatButton>}
    </nav>
  );
}
