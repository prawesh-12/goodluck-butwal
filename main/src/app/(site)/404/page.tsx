import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { ErrorBlock } from "@/components/shared/error-block";
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/404", title: "Page not found", noindex: true });
}
export default function Page404() { return <ErrorBlock />; }
