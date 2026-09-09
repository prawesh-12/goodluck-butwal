"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// Magic UI's HeroVideoDialog ("from-center"), playing a local mp4 instead of an iframe.
// The modal is portalled to <body> because the thumbnail lives inside a card link, and the play button stops that link from navigating.
export function VideoDialog({ src, loopSrc, poster, title, inline, prefetch, bare, className = "" }: { src: string; loopSrc?: string; poster?: string; title: string; inline?: boolean; prefetch?: boolean; bare?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  // `inline` is a live "should be rolling" flag. The element is kept once mounted so scrolling back
  // and forth does not restart the download; it just plays or rewinds and pauses.
  // `prefetch` mounts and buffers it; `inline` starts and stops playback. Splitting the two keeps the decode
  // off the frame where the card arrives, which is what would otherwise show up as a stutter mid-scroll.
  const [mounted, setMounted] = useState(false);
  const loop = useRef<HTMLVideoElement>(null);
  if ((inline || prefetch) && !mounted) setMounted(true);
  useEffect(() => {
    const v = loop.current;
    if (!v) return;
    if (inline) void v.play().catch(() => {});
    else v.pause();
  }, [inline, mounted]);

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
        {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover transition-[filter] duration-200 ease-out group-hover:brightness-[0.85]" loading="lazy" decoding="async" />}
        {/* Layered over the poster rather than swapped with it, so buffering and loop restarts cannot
            flash through. With no poster the video mounts straight away and paints its own first
            frame, reading only the header until the card is warmed. */}
        {(mounted || !poster) && (
          <video ref={loop} src={loopSrc ?? src} poster={poster} muted loop playsInline preload={mounted ? "auto" : "metadata"} disablePictureInPicture disableRemotePlayback className="absolute inset-0 size-full object-cover transition-[filter] duration-200 ease-out group-hover:brightness-[0.85]" />
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
                    <video src={src} title={title} controls autoPlay playsInline className="block h-[min(85vh,760px)] w-auto max-w-[92vw]" />
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
