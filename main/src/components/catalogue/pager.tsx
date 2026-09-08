import { FlatButton } from "@/components/ui/button";
import { loadText } from "@/server/queries/text";

export async function Pager({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  const t = await loadText();
  return (
    <nav aria-label="Pagination" className="flex w-full flex-wrap items-center justify-center gap-5">
      {page > 1 && <FlatButton href={hrefFor(page - 1)} tone="dark">{t("cta.previous", "Previous")}</FlatButton>}
      <p className="t-base text-muted">{t("cta.page_of", "Page {page} of {pages}").replace("{page}", String(page)).replace("{pages}", String(pages))}</p>
      {page < pages && <FlatButton href={hrefFor(page + 1)} tone="dark">{t("cta.next", "Next")}</FlatButton>}
    </nav>
  );
}
