import type { Metadata } from "next";
import "../globals.css";
import { bricolage, interDisplay } from "@/lib/fonts";
import { company } from "@/lib/site";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { OfficeProvider } from "@/components/office";
import { Analytics } from "@/components/analytics";
import { listOffices } from "@/server/queries/offices";
import { getFooterColumns, getSocialLinks } from "@/server/queries/site";
import { loadText } from "@/server/queries/text";

export const metadata: Metadata = {
  metadataBase: new URL(company.url),
  title: { default: company.name, template: `%s – ${company.short}` },
  description: "Education counselling, visa guidance, scholarship guidance and IELTS coaching from offices in Melbourne, Butwal and Cebu.",
  icons: { icon: "/brand/icon.png" },
  openGraph: { siteName: company.name, type: "website" },
};

// Published content is live within five minutes without a deploy. Admin routes opt out with
// force-dynamic.
export const revalidate = 300;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [offices, columns, socials, t] = await Promise.all([
    listOffices(),
    getFooterColumns(),
    getSocialLinks(),
    loadText(),
  ]);

  return (
    <html lang="en" className={`${interDisplay.variable} ${bricolage.variable}`}>
      <body className="overflow-x-clip">
        <OfficeProvider offices={offices}>
          <SmoothScroll />
          <Nav
            text={{
              bookCta: t("nav.book_cta", "Book a consultation"),
              officeSelector: t("nav.office_selector_label", "Choose your office"),
              menuOpen: t("nav.menu_open", "Open menu"),
              menuClose: t("nav.menu_close", "Close menu"),
            }}
          />
          <main className="flex flex-col items-start">{children}</main>
          <Footer
            columns={columns}
            socials={socials}
            text={{
              tagline: t("footer.tagline", "Ready to create your luck?"),
              officesHeading: t("footer.offices.title", "Offices"),
              copyright: t("footer.copyright", "© {year} {name}. All rights reserved."),
            }}
          />
        </OfficeProvider>
        <Analytics />
      </body>
    </html>
  );
}
