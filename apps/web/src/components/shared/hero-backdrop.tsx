"use client";
import { Img } from "@/components/ui/img";

// Client component on purpose. Rendered from a server component, React Flight turns this
// fetchPriority="high" img into a preload hint in the RSC payload, so every route the home
// page prefetched downloaded its hero sky too. SSR still emits the same img and preload.
export function HeroBackdrop({ src }: { src: string }) {
  return <Img src={src} alt="" sizes="100vw" w={1280} className="absolute inset-0 size-full object-cover" style={{ objectPosition: "50% 0%" }} fetchPriority="high" decoding="async" />;
}
