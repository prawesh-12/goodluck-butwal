export const img = {
  arrow: "/images/ui/arrow.svg",
  heroSky: "/images/hero/sky-v2.webp",
  cloud1: "/images/ui/cloud1.webp",
  cloud2: "/images/ui/cloud2.png",
  cloud3: "/images/ui/cloud3.webp",
  star: "/images/ui/star.svg",
  bolt: "/images/ui/bolt.svg",
  overviewIcons: ["/images/ui/overview-icons-01.svg", "/images/ui/overview-icons-02.svg", "/images/ui/overview-icons-03.svg"],
  chevron: "/images/ui/chevron.svg",
  statIcons: ["/images/ui/stat-icons-01.svg", "/images/ui/stat-icons-02.svg", "/images/ui/stat-icons-03.svg", "/images/ui/stat-icons-04.svg", "/images/ui/stat-icons-05.svg"],
  heart: "/images/ui/heart.svg",
  stars5: "/images/ui/stars5.svg",
  testimonialBg: "/images/backgrounds/reviews.webp",
  storiesBg: "/images/backgrounds/stories.webp",
  check: "/images/ui/check.svg",
  pricingDeco: "/images/ui/pricing-deco.webp",
  footerBg: "/images/backgrounds/footer-v2.webp",
  fieldSky: "/images/ui/field-sky.avif",
  arrowLeft: "/images/ui/arrow-left.svg",
};

export const gl = {
  logo: "/brand/logo.png",
  mark: "/brand/mark.png",
  plane: "/images/illustrations/plane.webp",
  campus: "/images/illustrations/campus.webp",
  heroMeadow: "/images/hero/meadow.webp",
  film: "/videos/goodluck-education.mp4",
  filmPoster: "/images/hero/film-poster.webp",
  teamPhoto: "/images/about/team-photo.webp",
  founders: "/images/team/co-founders.webp",
};

export const destinationArt: Record<string, { flag: string; card: string; hero: string; heroAlt: string }> = {
  australia: {
    flag: "/images/flags/australia.svg",
    card: "/images/destinations/australia-card-v2.webp",
    hero: "/images/destinations/australia-hero.webp",
    heroAlt: "Student working on a wind power project with a clipboard",
  },
  "new-zealand": {
    flag: "/images/flags/new-zealand.svg",
    card: "/images/destinations/new-zealand-card-v3.webp",
    hero: "",
    heroAlt: "",
  },
  "united-kingdom": {
    flag: "/images/flags/united-kingdom.svg",
    card: "/images/destinations/united-kingdom-card-v2.webp",
    hero: "/images/destinations/united-kingdom-hero.webp",
    heroAlt: "Student preparing for exams at a desk full of books",
  },
};

export const serviceArt: Record<string, { image: string; imageAlt: string; video: string; poster: string }> = {
  "education-counselling": {
    image: "/images/services/education-counselling-v2.webp",
    imageAlt: "Graduation cap on a stack of books beside a globe",
    video: "/videos/education-counselling.mp4",
    poster: "/images/services/education-counselling-poster.webp",
  },
  "visa-guidance": {
    image: "/images/services/visa-guidance-v2.webp",
    imageAlt: "Passport with a boarding pass, a paper plane and an approved tick",
    video: "/videos/visa-guidance.mp4",
    poster: "/images/services/visa-guidance-poster.webp",
  },
  "scholarship-guidance": {
    image: "/images/services/scholarship-guidance-v2.webp",
    imageAlt: "Rolled diploma with a ribbon, gold coins and a trophy",
    video: "/videos/scholarship-guidance.mp4",
    poster: "/images/services/scholarship-guidance-poster.webp",
  },
  "ielts-coaching": {
    image: "/images/services/ielts-coaching-v2.webp",
    imageAlt: "Headphones on an open notebook with a pencil and a speech bubble",
    video: "/videos/ielts-coaching.mp4",
    poster: "/images/services/ielts-coaching-poster.webp",
  },
};

export const csrArt: Record<string, { logo: string; photo?: string }> = {
  "The Himalayan Tigers": {
    logo: "/images/about/the-himalayan-tigers-logo.webp",
    photo: "/images/about/the-himalayan-tigers.webp",
  },
  "Youth For Good Nepal": { logo: "/images/about/youth-for-good-nepal-logo.webp" },
  "Melbourne Chinese Soccer Association": {
    logo: "/images/about/melbourne-chinese-soccer-association-logo.webp",
    photo: "/images/about/melbourne-chinese-soccer-association.webp",
  },
};
