import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { Services } from "@/components/home/services";
import { Why } from "@/components/home/why";
import { Destinations } from "@/components/home/destinations";
import { Offices } from "@/components/home/offices";
import { Stats } from "@/components/home/stats";
import { Reviews } from "@/components/home/reviews";
import { Stories } from "@/components/home/stories";
import { News } from "@/components/home/news";
import { Faqs } from "@/components/home/faqs";

export default function Home() {
  return (
    <>
      <Hero />
      <Partners />
      <Services />
      <Why />
      <Destinations />
      <Offices />
      <Stats />
      <Reviews />
      <Stories />
      <News />
      <Faqs />
    </>
  );
}
