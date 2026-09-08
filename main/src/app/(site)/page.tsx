import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { organization, webSite } from "@/components/seo/schema";
import { getSocialLinks } from "@/server/queries/site";
import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { Services } from "@/components/home/services";
import { Destinations } from "@/components/home/destinations";
import { Offices } from "@/components/home/offices";
import { listPartnerLogos, listTeam } from "@/server/queries/people";
import { listServices } from "@/server/queries/services";
import { listAllFaqs, listDestinations } from "@/server/queries/destinations";
import { getGoogleRating, listArticles, listReviews, listSuccessStories } from "@/server/queries/editorial";
import { getAboutContent } from "@/server/queries/pages";
import { loadText } from "@/server/queries/text";
import { destinationCards } from "@/components/home/destinations";
import { Reviews } from "@/components/home/reviews";
import { Stories } from "@/components/home/stories";
import { News } from "@/components/home/news";
import { Faqs } from "@/components/home/faqs";
import { Events } from "@/components/home/events";
import { listUpcomingEvents } from "@/server/queries/events";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/" });
}

export default async function Home() {
  const [logos, faces, services, allFaqs, cards, articles, reviews, successStories, googleRating, about] =
    await Promise.all([
    listPartnerLogos(),
    listTeam().then((t) => t.slice(0, 3)),
    listServices(),
    listAllFaqs(),
    listDestinations().then((rows) => destinationCards(rows)),
    listArticles(),
    listReviews(),
    listSuccessStories(),
    getGoogleRating(),
    getAboutContent(),
  ]);

  const upcomingEvents = await listUpcomingEvents();
  const socials = await getSocialLinks();
  const t = await loadText();

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
      <Reviews reviews={reviews} googleRating={googleRating} values={about.values} />
      <Stories successStories={successStories} googleRating={googleRating} />
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
