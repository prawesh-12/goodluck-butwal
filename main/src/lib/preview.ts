import type { Metadata } from "next";

export function previewPath(kind: string, slug: string) {
  return kind === "post" ? `/preview/post/${slug}` : `/preview/${kind}/${encodeURIComponent(slug)}`;
}


export const previewMetadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};
