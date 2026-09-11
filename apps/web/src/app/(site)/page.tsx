import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import { organization, webSite } from "@/lib/seo/schema";
import { getSocialLinks } from "@/features/settings/queries";
import { Hero } from "@/components/shared/hero";
import { Partners } from "@/features/partners/components/partners";
import { Services } from "@/features/services/components/services";
import { Destinations } from "@/features/destinations/components/destinations";
import { Offices } from "@/features/offices/components/offices";
import { listPartnerLogos } from "@/features/partners/queries";
import { listTeam } from "@/features/team/queries";
import { listServices } from "@/features/services/queries";
import { listAllFaqs } from "@/features/services/queries";
import { listDestinations } from "@/features/destinations/queries";
import { getGoogleRating } from "@/features/settings/queries";
import { listArticles } from "@/features/posts/queries";
import { getAboutContent } from "@/features/pages/queries";
import { loadText } from "@/features/site-text/queries";
import { destinationCards } from "@/features/destinations/components/destinations";
import { Reviews } from "@/features/testimonials/components/reviews";
import { Stories } from "@/features/testimonials/components/stories";
import { News } from "@/features/posts/components/news";
import { Faqs } from "@/components/shared/faqs";
import { Events } from "@/features/events/components/events";
import { listUpcomingEvents } from "@/features/events/queries";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/" });
}

export default async function Home() {
  // Nothing here depends on anything else here, so the page waits once rather than twelve times.
  const [
    logos, faces, services, allFaqs, cards, articles, googleRating, about,
    upcomingEvents, socials, t,
  ] = await Promise.all([
    listPartnerLogos(),
    listTeam().then((rows) => rows.slice(0, 3)),
    listServices(),
    listAllFaqs(),
    listDestinations().then((rows) => destinationCards(rows)),
    listArticles(),
    getGoogleRating(),
    getAboutContent(),
    listUpcomingEvents(),
    getSocialLinks(),
    loadText(),
  ]);

  return (
    <>
      <JsonLd data={[organization(socials.map((s) => s.href)), webSite()]} />
      <Hero
        googleRating={googleRating}
        text={{
          titleBefore: t("home.hero.title_before", "Create your"),
          titleAfter: t("home.hero.title_after", "luck"),
          bookCta: t("home.hero.cta", "Book a consultation"),
          servicesCta: t("home.hero.services_cta", "Our services"),
        }}
      />
      <Partners logos={logos} />
      <Destinations cards={cards} />
      <Services services={services} />
      <Reviews googleRating={googleRating} values={about.values} />
      <Stories googleRating={googleRating} />
      <Offices logos={logos} />
      <News articles={articles} />
      <Events
        events={upcomingEvents}
        text={{
          badge: t("home.events.badge", "Events"),
          title: t("home.events.title", "Coming up near you"),
          cta: t("home.events.cta", "All events"),
        }}
      />
      <Faqs
        faces={faces}
        items={allFaqs}
        text={{
          title: t("home.faqs.title", "Frequently asked questions"),
          lead: t("home.faqs.lead", "Common questions about programmes, scholarships and visas."),
          still: {
            title: t("home.faqs.still.title", "Still have questions?"),
            line: t("home.faqs.still.line", "Book an appointment and our team can assess your case."),
            cta: t("home.faqs.still.cta", "Book an appointment"),
            you: t("home.faqs.still.you", "You"),
          },
        }}
      />
    </>
  );
}
