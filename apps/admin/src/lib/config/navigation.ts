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
      label: "Library",
      links: [
        { text: "Exercises", href: "/library/exercises", icon: "library-exercises" },
        { text: "Review queue", href: "/library/exercises/review", icon: "library-review" },
        { text: "Schemes", href: "/library/schemes", icon: "library-schemes" },
        { text: "Block types", href: "/library/block-types", icon: "library-block-types" },
      ],
    },
    {
      label: "Platform",
      links: [{ text: "Users", href: "/users", icon: "users" }],
    },
  ],
};
