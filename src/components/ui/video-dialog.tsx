"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// Magic UI's HeroVideoDialog, trimmed to one animation. The modal is portalled to <body> because
// the thumbnail lives inside a card link, and the play button stops that link from navigating.
export function VideoDialog({ src, title, children, className = "" }: { src: string; title: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);

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
      <div className={`relative ${className}`}>
        {children}
        <button
          type="button"
          aria-label={`Play video: ${title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
        >
          <span className="flex size-[68px] items-center justify-center rounded-full bg-black/10 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
            <span className="flex size-12 items-center justify-center rounded-full bg-ink shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-[3px] size-5 fill-white text-white" />
            </span>
          </span>
        </button>
      </div>
      {open &&
        createPortal(
          <AnimatePresence>
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
                <div className="overflow-hidden rounded-2xl border-2 border-white bg-white">
                  <iframe
                    src={src}
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="block h-[min(85vh,760px)] w-[min(92vw,420px)]"
                  />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
