// The four services goodluck_main publishes: three under /service/ and the IELTS coaching page.
export type Service = {
  slug: string;
  title: string;
  label: string;
  line: string;
  intro: string;
  image: string;
  imageAlt: string;
  video?: string; // reel from @goodluck.butwal, saved from extras/video_assets and played in the card
  poster?: string; // 16:9 frame from the video, shown on the card
  stepsTitle: string;
  steps: { title: string; line: string }[];
  listTitle?: string;
  list?: string[];
  facts?: { value: string; label: string }[];
};

export const services: Service[] = [
  {
    slug: "education-counselling",
    video: "/videos/education-counselling.mp4",
    poster: "/images/services/education-counselling-poster.jpg",
    title: "Education Counselling",
    label: "Study",
    line: "Course selection and admission counselling.",
    intro:
      "We step in as the official representative of more than 100 colleges, institutions, universities and TAFE facilities, with certified counsellors who speak over five languages.",
    image: "/images/services/education-counselling-v2.jpg",
    imageAlt: "Graduation cap on a stack of books beside a globe",
    stepsTitle: "How counselling works",
    steps: [
      { title: "Identifying course and institution", line: "Background research and Genuine Temporary Entrant (GTE) eligibility." },
      { title: "Recognition of Prior Learning", line: "Prior qualifications, skills and experience are assessed through RPL." },
      { title: "Identifying the necessary paperwork", line: "Support with the documents your application requires." },
    ],
    listTitle: "Documents we help you prepare",
    list: [
      "All academic documents",
      "Job experience certificates",
      "English language test scores (PTE/IELTS)",
      "Entrance exam test scores (GRE/GMAT/LSAT/MCAT)",
      "Statement of Purpose (SOP)",
      "Letters of Recommendation (LOR)",
      "Certificates for extra-curricular activities",
      "Proof of sufficient funds",
      "Medium of Instruction (MOI)",
    ],
  },
  {
    slug: "visa-guidance",
    video: "/videos/visa-guidance.mp4",
    poster: "/images/services/visa-guidance-poster.jpg",
    title: "Visa Guidance",
    label: "Visa",
    line: "Consultation, documents, application and follow-up.",
    intro:
      "Our experienced team provides visa guidance and support so your path to international education stays on track.",
    image: "/images/services/visa-guidance-v2.jpg",
    imageAlt: "Passport with a boarding pass, a paper plane and an approved tick",
    stepsTitle: "Our visa services include",
    steps: [
      { title: "Expert consultation", line: "Understand the visa options for your course and destination." },
      { title: "Document preparation", line: "Financial statements, proof of enrolment, health insurance and more." },
      { title: "Application assistance", line: "Step-by-step help completing the forms accurately." },
      { title: "Genuine Temporary Entrant (GTE)", line: "Help preparing your GTE statement." },
      { title: "Interview preparation", line: "Mock interviews when an interview is part of the process." },
      { title: "Submission and follow-up", line: "We lodge the application and track its progress." },
      { title: "Post-visa support", line: "Travel tips, accommodation guidance and pre-departure orientation." },
    ],
  },
  {
    slug: "scholarship-guidance",
    video: "/videos/scholarship-guidance.mp4",
    poster: "/images/services/scholarship-guidance-poster.jpg",
    title: "Scholarship Guidance",
    label: "Funding",
    line: "A step-by-step guide to finding and applying for scholarships.",
    intro: "Securing a scholarship to study in Australia can significantly ease the financial burden of education.",
    image: "/images/services/scholarship-guidance-v2.jpg",
    imageAlt: "Rolled diploma with a ribbon, gold coins and a trophy",
    stepsTitle: "Step by step",
    steps: [
      { title: "Identify your field and level", line: "Undergraduate, postgraduate or PhD." },
      { title: "Research universities and programs", line: "Each university has its own scholarships." },
      { title: "Visit university websites", line: "Look for the international student scholarship section." },
      { title: "Scholarships from external organisations", line: "Non-profits, private companies and foundations." },
      { title: "Check eligibility criteria", line: "Merit, financial need, leadership or community involvement." },
      { title: "Prepare required documents", line: "See the checklist below." },
      { title: "Submit applications early", line: "Deadlines can be well ahead of the academic year." },
      { title: "Follow instructions carefully", line: "Provide every document and detail accurately." },
      { title: "Apply for multiple scholarships", line: "Apply for as many as you are eligible for." },
      { title: "Keep records", line: "Copies of every application and correspondence." },
      { title: "Be persistent and positive", line: "Keep applying." },
    ],
    listTitle: "Most scholarships require",
    list: [
      "Academic transcripts and certificates",
      "Letters of recommendation",
      "A statement of purpose or personal essay",
      "Proof of English proficiency (IELTS, TOEFL)",
      "Passport copy",
      "CV or resume",
    ],
  },
  {
    slug: "ielts-coaching",
    video: "/videos/ielts-coaching.mp4",
    poster: "/images/services/ielts-coaching-poster.jpg",
    title: "IELTS Coaching",
    label: "Test preparation",
    line: "Practice tests, study materials and personalised coaching.",
    intro:
      "Goodluck offers affordable IELTS preparation packages that include practice tests, study materials and personalised coaching, plus a free demo class to get started.",
    image: "/images/services/ielts-coaching-v2.jpg",
    imageAlt: "Headphones on an open notebook with a pencil and a speech bubble",
    stepsTitle: "The four modules",
    steps: [
      { title: "Listening", line: "Four sections, ten questions each. The recording plays once." },
      { title: "Reading", line: "Three sections of 13 to 14 questions in 60 minutes." },
      { title: "Writing", line: "Two tasks: 150 words and a 250-word essay in 60 minutes." },
      { title: "Speaking", line: "A face-to-face interview in three parts, 11 to 14 minutes." },
    ],
    listTitle: "What you get",
    list: ["Professional coaching", "Personalised tests", "Experienced tutors", "Free demo class"],
    facts: [
      { value: "2h 44m", label: "Total test time, including 10 minutes of transfer time" },
      { value: "1 to 9", label: "Band scale, one score per module and an overall average" },
      { value: "140+", label: "Countries where IELTS is recognised" },
      { value: "10,000+", label: "Organisations that recognise IELTS" },
    ],
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);
