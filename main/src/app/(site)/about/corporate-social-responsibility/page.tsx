import type { Metadata } from "next";
import { buildEntityMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs } from "@/components/seo/schema";
import { getAboutContent } from "@/server/queries/pages";
import { Appear } from "@/components/ui/appear";
import { InnerHero } from "@/components/inner";
import { loadText } from "@/server/queries/text";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutContent();
  return buildEntityMetadata("page", "corporate-social-responsibility", {
    path: "/about/corporate-social-responsibility",
    title: "Corporate social responsibility",
    description: about.csrIntro,
  });
}

export default async function CsrPage() {
  const t = await loadText();
  const about = await getAboutContent();

  return (
    <>
      <JsonLd data={breadcrumbs([{ name: "Home", path: "/" }, { name: "About us", path: "/about" }, { name: "Corporate social responsibility", path: "/about/corporate-social-responsibility" }])} />
      <InnerHero badge={t("about.csr.badge", "Corporate social responsibility")} title={t("about.csr.title", "Community and sport")} lead={about.csrIntro} bg="field" />
      <section className="flex w-full flex-col items-center pb-[30px] md:pb-20 lg:pb-[100px]">
        <div className="container-x">
          <div className="grid gap-5 md:grid-cols-3 md:gap-[30px]">
            {about.csr.map((c, i) => (
              <Appear key={c.name} delay={0.1 * i} className="flex flex-col gap-[10px] overflow-clip rounded-[10px] bg-surface p-[10px] md:rounded-[30px]">
                <div className="relative aspect-[4/3] w-full overflow-clip rounded-[6px] bg-white md:rounded-[20px]">
                  {c.photo ? <img src={c.photo} alt={c.name} className="size-full object-cover" loading="lazy" decoding="async" /> : <img src={c.logo} alt={c.name} className="size-full object-contain p-10" loading="lazy" decoding="async" />}
                  <span className="absolute left-3 top-3 flex size-14 items-center justify-center rounded-full bg-white p-2 shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
                    <img src={c.logo} alt="" className="size-full object-contain" loading="lazy" decoding="async" />
                  </span>
                </div>
                <div className="flex flex-col items-start gap-[6px] p-4 md:p-5">
                  <h2 className="t-h5">{c.name}</h2>
                  <p className="t-base text-muted">{c.line}</p>
                </div>
              </Appear>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
