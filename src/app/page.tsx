import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { Services } from "@/components/home/services";
import { Destinations } from "@/components/home/destinations";
import { Offices } from "@/components/home/offices";
import { Reviews } from "@/components/home/reviews";
import { Stories } from "@/components/home/stories";
import { News } from "@/components/home/news";
import { Faqs } from "@/components/home/faqs";

export default function Home() {
  return (
    <>
      <Hero />
      <Partners />
      <Destinations />
      <Services />
      <Reviews />
      <Stories />
      <Offices />
      <News />
      <Faqs />
    </>
  );
}
