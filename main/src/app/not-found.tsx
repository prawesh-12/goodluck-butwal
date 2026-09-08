import { ErrorBlock } from "@/components/error-block";
import { loadText } from "@/server/queries/text";

export default async function NotFound() {
  const t = await loadText();
  return (
    <ErrorBlock
      badge={t("errors.404.badge", "Something went wrong")}
      title={t("errors.404.title", "Page not found")}
      lead={t("errors.404.body", "The page you are looking for doesn\u2019t exist or has been moved.")}
      cta={t("errors.404.cta", "Back to home")}
    />
  );
}
