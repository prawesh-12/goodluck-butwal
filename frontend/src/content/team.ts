import type { OfficeId } from "@/lib/site";

// 22 people, taken from goodluck_main/our-team. Name, role, office section and photo only: nothing else is published. Photos live in public/images/team.
export type Member = { slug: string; name: string; role: string; office: OfficeId | null; photo: string };

export const team: Member[] = [
  { slug: "bimal-gurung", name: "Bimal Gurung", role: "Cofounder / Director of Business Development", office: "au", photo: "/images/team/bimal-gurung.webp" },
  { slug: "kishor-gharti-magar", name: "Kishor Gharti Magar", role: "Cofounder / Global Director", office: "au", photo: "/images/team/kishor-gharti-magar.webp" },
  { slug: "olivia-graces", name: "Olivia Graces", role: "Marketing Manager", office: "au", photo: "/images/team/olivia-graces.webp" },
  { slug: "santosh-pandey", name: "Santosh Pandey", role: "Cofounder / Director of Finance", office: null, photo: "/images/team/santosh-pandey.webp" },
  { slug: "badal-gharti-magar", name: "Badal Gharti Magar", role: "Admission Manager", office: "au", photo: "/images/team/badal-gharti-magar.webp" },
  { slug: "pratik-gurung", name: "Pratik Gurung", role: "Public Relations Manager", office: null, photo: "/images/team/pratik-gurung.webp" },
  { slug: "ashal-kc", name: "Ashal Kc", role: "Marketing Officer", office: "au", photo: "/images/team/ashal-kc.webp" },
  { slug: "sabbir-md-khan", name: "Sabbir Md Khan", role: "Marketing Officer", office: null, photo: "/images/team/sabbir-md-khan.webp" },
  { slug: "rojan-kafle", name: "Rojan Kafle", role: "Marketing Officer", office: null, photo: "/images/team/rojan-kafle.webp" },
  { slug: "rejina-khanal", name: "Rejina Khanal", role: "Administrative Assistant", office: null, photo: "/images/team/rejina-khanal.webp" },
  { slug: "ari-ramadhan", name: "Ari Ramadhan", role: "Marketing Officer", office: "au", photo: "/images/team/ari-ramadhan.webp" },
  { slug: "jeremy-ciang", name: "Jeremy Ciang", role: "Marketing Officer", office: "au", photo: "/images/team/jeremy-ciang.webp" },
  { slug: "anil-maharjan", name: "Anil Maharjan", role: "Marketing Officer", office: "au", photo: "/images/team/anil-maharjan.webp" },
  { slug: "gerwin-c-perez", name: "Gerwin C. Perez", role: "Director", office: "ph", photo: "/images/team/gerwin-c-perez.webp" },
  { slug: "christian-adasobel", name: "Christian Adasobel", role: "Marketing Officer", office: "ph", photo: "/images/team/christian-adasobel.webp" },
  { slug: "rajeev-kunwar", name: "Rajeev Kunwar", role: "Managing Director", office: "np", photo: "/images/team/rajeev-kunwar.webp" },
  { slug: "bibas-gharti-magar", name: "Bibas Gharti Magar", role: "Marketing Director", office: "np", photo: "/images/team/bibas-gharti-magar.webp" },
  { slug: "rajendra-kunwar", name: "Rajendra Kunwar", role: "CEO", office: "np", photo: "/images/team/rajendra-kunwar.webp" },
  { slug: "junu-thapa-magar", name: "Junu Thapa Magar", role: "Content Creator", office: "np", photo: "/images/team/junu-thapa-magar.webp" },
  { slug: "barshad-gharti-magar", name: "Barshad Gharti Magar", role: "Documentation Officer", office: "np", photo: "/images/team/barshad-gharti-magar.webp" },
  { slug: "nishan-kunwar", name: "Nishan Kunwar", role: "Documentation Officer", office: "np", photo: "/images/team/nishan-kunwar.webp" },
  { slug: "siza-shrestha", name: "Siza Shrestha", role: "Admission Officer", office: "np", photo: "/images/team/siza-shrestha.webp" },
];

