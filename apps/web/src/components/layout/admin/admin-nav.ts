import type { Entity } from "@/lib/auth/rbac";

export type NavItem = { href: string; label: string; entity: Entity };
export type NavGroup = { heading: string; items: NavItem[] };

// A row appears only if the permission matrix says the user may read that entity.
export const NAV: NavGroup[] = [
  {
    heading: "Enquiries",
    items: [
      { href: "/admin/enquiries", label: "Enquiries", entity: "enquiries" },
      { href: "/admin/consultations", label: "Consultations", entity: "consultations" },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/team", label: "Team", entity: "team" },
      { href: "/admin/partners", label: "Partners", entity: "partners" },
      { href: "/admin/posts", label: "News", entity: "posts" },
      { href: "/admin/events", label: "Events", entity: "events" },
      { href: "/admin/institutions", label: "Institutions", entity: "institutions" },
      { href: "/admin/courses", label: "Courses", entity: "courses" },
      { href: "/admin/test-prep", label: "Test preparation", entity: "testPrep" },
    ],
  },
  {
    heading: "Media",
    items: [
      { href: "/admin/images", label: "Images", entity: "media" },
      { href: "/admin/videos", label: "Videos", entity: "media" },
    ],
  },
  {
    heading: "Admin",
    items: [{ href: "/admin/users", label: "Users", entity: "users" }],
  },
];
