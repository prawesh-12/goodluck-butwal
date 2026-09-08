import type { Entity } from "@/lib/rbac";

export type NavItem = { href: string; label: string; entity: Entity };
export type NavGroup = { heading: string; items: NavItem[] };

// The sidebar is data. A row appears only if the matrix says the user may read that entity.
export const NAV: NavGroup[] = [
  {
    heading: "Enquiries",
    items: [
      { href: "/admin/enquiries", label: "Enquiries", entity: "enquiries" },
      { href: "/admin/consultations", label: "Consultations", entity: "consultations" },
    ],
  },
  {
    heading: "Editorial",
    items: [
      { href: "/admin/posts", label: "Posts", entity: "posts" },
      { href: "/admin/post-categories", label: "Categories", entity: "postCategories" },
      { href: "/admin/tags", label: "Tags", entity: "tags" },
      { href: "/admin/events", label: "Events", entity: "events" },
      { href: "/admin/testimonials", label: "Testimonials", entity: "testimonials" },
    ],
  },
  {
    heading: "Study",
    items: [
      { href: "/admin/destinations", label: "Destinations", entity: "destinations" },
      { href: "/admin/institutions", label: "Institutions", entity: "institutions" },
      { href: "/admin/courses", label: "Courses", entity: "courses" },
      { href: "/admin/course-categories", label: "Course categories", entity: "courseCategories" },
      { href: "/admin/test-prep", label: "Test preparation", entity: "testPrep" },
    ],
  },
  {
    heading: "Site",
    items: [
      { href: "/admin/pages", label: "Pages", entity: "pages" },
      { href: "/admin/services", label: "Services", entity: "services" },
      { href: "/admin/offices", label: "Offices", entity: "offices" },
      { href: "/admin/team", label: "Team", entity: "team" },
      { href: "/admin/partners", label: "Partners", entity: "partners" },
      { href: "/admin/site-text", label: "Site text", entity: "uiStrings" },
      { href: "/admin/media", label: "Media", entity: "media" },
    ],
  },
  {
    heading: "Admin",
    items: [
      { href: "/admin/settings", label: "Settings", entity: "settings" },
      { href: "/admin/redirects", label: "Redirects", entity: "redirects" },
      { href: "/admin/users", label: "Users", entity: "users" },
      { href: "/admin/audit-log", label: "Audit log", entity: "auditLog" },
      { href: "/admin/help", label: "Help", entity: "auditLog" },
    ],
  },
];
