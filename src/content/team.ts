import type { OfficeId } from "@/lib/site";

// 22 people, taken from goodluck_main/our-team. Name, role, office section and photo only: nothing else is published.
export type Member = { slug: string; name: string; role: string; office: OfficeId | null; photo: string };

const p = (f: string) => `/assets/${f}`;

export const team: Member[] = [
  { slug: "bimal-gurung", name: "Bimal Gurung", role: "Cofounder / Director of Business Development", office: "au", photo: p("2024/08/DSC07053-2-2-1-345x400.jpg") },
  { slug: "kishor-gharti-magar", name: "Kishor Gharti Magar", role: "Cofounder / Global Director", office: "au", photo: p("2024/08/DSC07025-2-2-345x400.jpg") },
  { slug: "olivia-graces", name: "Olivia Graces", role: "Marketing Manager", office: "au", photo: p("2024/08/12-345x400.png") },
  { slug: "santosh-pandey", name: "Santosh Pandey", role: "Cofounder / Director of Finance", office: null, photo: p("2024/08/santosh-pandey-669x724-1-540x587.jpg") },
  { slug: "badal-gharti-magar", name: "Badal Gharti Magar", role: "Admission Manager", office: "au", photo: p("2024/08/13-345x400.png") },
  { slug: "pratik-gurung", name: "Pratik Gurung", role: "Public Relations Manager", office: null, photo: p("2024/08/Pratik-Gurung-669x724-1-540x587.jpg") },
  { slug: "ashal-kc", name: "Ashal Kc", role: "Marketing Officer", office: "au", photo: p("2024/08/Ashal-KC-669x724-1-345x400.jpg") },
  { slug: "sabbir-md-khan", name: "Sabbir Md Khan", role: "Marketing Officer", office: null, photo: p("2024/08/Sabbir-Md-Khan-669x724-1-540x587.jpg") },
  { slug: "rojan-kafle", name: "Rojan Kafle", role: "Marketing Officer", office: null, photo: p("2024/08/Rojan-Kafle-1-e1682690396959-669x724-1-540x587.jpg") },
  { slug: "rejina-khanal", name: "Rejina Khanal", role: "Administrative Assistant", office: null, photo: p("2024/08/Rejina-Khanal-669x724-1-540x587.jpg") },
  { slug: "ari-ramadhan", name: "Ari Ramadhan", role: "Marketing Officer", office: "au", photo: p("2024/08/14-345x400.jpg") },
  { slug: "jeremy-ciang", name: "Jeremy Ciang", role: "Marketing Officer", office: "au", photo: p("2024/08/15-345x400.png") },
  { slug: "anil-maharjan", name: "Anil Maharjan", role: "Marketing Officer", office: "au", photo: p("2024/08/16-345x400.png") },
  { slug: "gerwin-c-perez", name: "Gerwin C. Perez", role: "Director", office: "ph", photo: p("2024/08/18-345x400.jpg") },
  { slug: "christian-adasobel", name: "Christian Adasobel", role: "Marketing Officer", office: "ph", photo: p("2024/08/19-345x400.jpg") },
  { slug: "rajeev-kunwar", name: "Rajeev Kunwar", role: "Managing Director", office: "np", photo: p("2025/07/viber_image_2025-07-30_11-44-27-376-540x587.jpg") },
  { slug: "bibas-gharti-magar", name: "Bibas Gharti Magar", role: "Marketing Director", office: "np", photo: p("2025/07/viber_image_2025-07-30_11-44-31-646-540x587.jpg") },
  { slug: "rajendra-kunwar", name: "Rajendra Kunwar", role: "CEO", office: "np", photo: p("2024/08/viber_image_2025-07-30_11-46-31-952-7-540x587.jpg") },
  { slug: "junu-thapa-magar", name: "Junu Thapa Magar", role: "Content Creator", office: "np", photo: p("2025/07/viber_image_2025-07-30_11-44-25-466-540x587.jpg") },
  { slug: "barshad-gharti-magar", name: "Barshad Gharti Magar", role: "Documentation Officer", office: "np", photo: p("2025/07/viber_image_2025-07-30_11-44-22-414-540x587.jpg") },
  { slug: "nishan-kunwar", name: "Nishan Kunwar", role: "Documentation Officer", office: "np", photo: p("2025/07/viber_image_2025-07-30_11-44-29-738-1-540x587.jpg") },
  { slug: "siza-shrestha", name: "Siza Shrestha", role: "Admission Officer", office: "np", photo: p("2025/07/viber_image_2025-07-30_11-44-33-405-540x587.jpg") },
];

export const teamByOffice = (id: OfficeId) => team.filter((m) => m.office === id);
