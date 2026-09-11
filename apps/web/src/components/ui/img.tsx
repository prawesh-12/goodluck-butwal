import { assetSrcSet, assetUrl } from "@/lib/utils/media-url";

type Props = Omit<React.ComponentProps<"img">, "src" | "alt"> & { src: string; alt: string; w?: number; widths?: readonly number[] };

export const CARD_SIZES = "(min-width: 1200px) 33vw, (min-width: 810px) 50vw, 100vw";

// `widths` is for something far smaller than the 320 the default ladder starts at.
export function Img({ src, alt, w = 960, widths, sizes, ...rest }: Props) {
  return <img {...rest} alt={alt} src={assetUrl(src, w)} srcSet={sizes ? assetSrcSet(src, widths) : undefined} sizes={sizes} />;
}
