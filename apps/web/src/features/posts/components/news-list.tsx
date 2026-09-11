"use client";

import { useState } from "react";
import { LazyMotion, domMax, m } from "framer-motion";
import { NewsCard, type Article } from "@/components/shared/inner";

export function NewsList({ articles }: { articles: Article[] }) {
  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];
  const [cat, setCat] = useState("All");
  const shown = (cat === "All" ? articles : articles.filter((a) => a.category === cat)).slice().sort((a, b) => b.date.localeCompare(a.date));
  return (
    <LazyMotion features={domMax}>
      <div className="flex w-full flex-col items-center gap-[30px] md:gap-10 lg:gap-[50px]">
        <div role="tablist" aria-label="Filter by category" className="flex flex-wrap items-center justify-center gap-[10px]">
          {categories.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className="relative h-[38px] overflow-clip rounded-full bg-surface px-5 text-[14px] font-medium leading-[18.2px]">
              {cat === c && <m.span layoutId="news-tab" className="absolute inset-0 bg-[#100F12]" transition={{ type: "spring", bounce: 0, duration: 0.5 }} />}
              <span className={`relative transition-colors duration-300 ${cat === c ? "text-white" : "text-muted"}`}>{c}</span>
            </button>
          ))}
        </div>
        <m.div layout className="grid w-full gap-5 md:grid-cols-2 md:gap-[30px] lg:grid-cols-3">
          {shown.map((a, i) => (
            <m.div key={a.slug} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.6, delay: Math.min(i * 0.04, 0.4) }}>
              <NewsCard article={a} />
            </m.div>
          ))}
        </m.div>
      </div>
    </LazyMotion>
  );
}
