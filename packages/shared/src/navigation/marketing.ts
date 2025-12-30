import type { MarketingNavigationConfig } from "../types";

export const MARKETING_NAVIGATION: MarketingNavigationConfig = {
  headerLinks: [
    { text: "Home", href: "/" },
    { text: "Programs", href: "/programs" },
    { text: "About", href: "/about" },
    { text: "Blog", href: "/blog" },
    { text: "Contact", href: "/contact" },
  ],

  footerLinks: [
    { text: "Privacy Policy", href: "/privacy" },
    { text: "Terms of Service", href: "/terms" },
  ],
};
