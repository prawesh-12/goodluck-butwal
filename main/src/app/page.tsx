import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { Services } from "@/components/home/services";
import { Destinations } from "@/components/home/destinations";
import { Offices } from "@/components/home/offices";
import { listPartnerLogos, listTeam } from "@/server/queries/people";
import { listServices } from "@/server/queries/services";
import { Reviews } from "@/components/home/reviews";
import { Stories } from "@/components/home/stories";
import { News } from "@/components/home/news";
import { Faqs } from "@/components/home/faqs";

export default async function Home() {
  const [logos, faces, services] = await Promise.all([
    listPartnerLogos(),
    listTeam().then((t) => t.slice(0, 3)),
    listServices(),
  ]);

  return (
    <>
      <Hero />
      <Partners logos={logos} />
      <Destinations />
      <Services services={services} />
      <Reviews />
      <Stories />
      <Offices logos={logos} />
      <News />
      <Faqs faces={faces} />
    </>
  );
}
