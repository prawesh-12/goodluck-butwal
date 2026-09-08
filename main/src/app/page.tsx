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
import { destinationCards } from "@/components/home/destinations";
import { Reviews } from "@/components/home/reviews";
import { Stories } from "@/components/home/stories";
import { News } from "@/components/home/news";
import { Faqs } from "@/components/home/faqs";
import { Events } from "@/components/home/events";
import { listUpcomingEvents } from "@/server/queries/events";

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

  return (
    <>
      <Hero googleRating={googleRating} />
      <Partners logos={logos} />
      <Destinations cards={cards} />
      <Services services={services} />
      <Reviews reviews={reviews} googleRating={googleRating} values={about.values} />
      <Stories successStories={successStories} googleRating={googleRating} />
      <Offices logos={logos} />
      <News articles={articles} />
      <Events events={upcomingEvents} />
      <Faqs faces={faces} items={allFaqs} />
    </>
  );
}
