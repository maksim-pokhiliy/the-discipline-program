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
        { text: "Exercises", href: "/exercises", icon: "exercises" },
        { text: "Labels", href: "/labels", icon: "labels" },
      ],
    },
  ],
};
