"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { assetUrl, videoStreamUrl, videoUrl } from "@/lib/utils/media-url";
import { CARD_SIZES, Img } from "@/components/ui/img";

// Portalled to <body>: the thumbnail sits inside a card link, and the play button must not navigate it.
export function VideoDialog({ src, poster, title, inline, prefetch, bare, className = "" }: { src: string; poster?: string; title: string; inline?: boolean; prefetch?: boolean; bare?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  // prefetch mounts and buffers, inline starts and stops playback. Splitting them keeps the
  // decode off the frame the card arrives on. Once mounted the element stays, so scrolling
  // back does not restart the download.
  const [mounted, setMounted] = useState(false);
  const loop = useRef<HTMLVideoElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  if ((inline || prefetch) && !mounted) setMounted(true);
  useEffect(() => {
    const v = loop.current;
    if (!v) return;
    if (inline) void v.play().catch(() => {});
    else v.pause();
  }, [inline, mounted]);

  // Safari plays HLS natively; everyone else needs the library, so it is fetched on open only.
  useEffect(() => {
    const v = player.current;
    if (!open || !v) return;
    const stream = videoStreamUrl(src);
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = stream;
      return;
    }

    let cancelled = false;
    let hls: { destroy: () => void } | undefined;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        v.src = videoUrl(src, 1280);
        return;
      }
      const instance = new Hls();
      hls = instance;
      instance.loadSource(stream);
      instance.attachMedia(v);
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Play video: ${title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`relative block cursor-pointer ${className}`}
      >
        {poster && <Img src={poster} alt="" sizes={CARD_SIZES} className="absolute inset-0 size-full object-cover transition-[filter] duration-200 ease-out group-hover:brightness-[0.85]" loading="lazy" decoding="async" />}
        {/* Layered over the poster rather than swapped with it, so buffering and loop restarts cannot
            flash through. With no poster the video mounts straight away and paints its own first
            frame, reading only the header until the card is warmed. */}
        {(mounted || !poster) && (
          <video ref={loop} src={videoUrl(src, 480)} poster={poster && assetUrl(poster, 640)} muted loop playsInline preload={mounted ? "auto" : "metadata"} disablePictureInPicture disableRemotePlayback className="absolute inset-0 size-full object-cover transition-[filter] duration-200 ease-out group-hover:brightness-[0.85]" />
        )}
        {!bare && (
          <span className="absolute inset-0 flex scale-90 items-center justify-center transition-transform duration-200 ease-out group-hover:scale-100">
            <span className="flex size-[68px] items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <span className="flex size-12 items-center justify-center rounded-full bg-ink shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-out group-hover:scale-110">
                <Play className="ml-[3px] size-5 fill-white text-white" />
              </span>
            </span>
          </span>
        )}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative"
                >
                  <button
                    type="button"
                    aria-label="Close video"
                    onClick={() => setOpen(false)}
                    className="absolute -top-14 right-0 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md transition-colors hover:bg-white/30"
                  >
                    <X className="size-5" />
                  </button>
                  <div className="overflow-hidden rounded-2xl border-2 border-white bg-black">
                    <video ref={player} title={title} controls autoPlay playsInline className="block h-[min(85vh,760px)] w-auto max-w-[92vw]" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
