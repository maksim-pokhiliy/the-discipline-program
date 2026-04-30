import { type AdminNavigationConfig } from "@repo/shared";

export const ADMIN_NAVIGATION: AdminNavigationConfig = {
  dashboard: { text: "Dashboard", href: "/", icon: "dashboard" },
  groups: [
    {
      label: "Marketing",
      links: [
        { text: "Products", href: "/products", icon: "products" },
        { text: "Reviews", href: "/reviews", icon: "reviews" },
        { text: "Blog", href: "/blog", icon: "blog" },
        { text: "Pages", href: "/pages", icon: "pages" },
        { text: "Contacts", href: "/contacts", icon: "contacts" },
      ],
    },
    {
      label: "Platform",
      links: [{ text: "Users", href: "/users", icon: "users" }],
    },
    {
      label: "Library",
      links: [
        { text: "Exercises", href: "/library/exercises", icon: "library-exercises" },
        { text: "Block kinds", href: "/library/block-kinds", icon: "library-block-kinds" },
        {
          text: "Scheme templates",
          href: "/library/scheme-templates",
          icon: "library-scheme-templates",
        },
        {
          text: "Block templates",
          href: "/library/block-templates",
          icon: "library-block-templates",
        },
        {
          text: "Session templates",
          href: "/library/session-templates",
          icon: "library-session-templates",
        },
        {
          text: "Week templates",
          href: "/library/week-templates",
          icon: "library-week-templates",
        },
      ],
    },
  ],
};
