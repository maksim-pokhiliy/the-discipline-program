import type { MarketingNavigationConfig } from "@repo/shared";

export const MARKETING_NAVIGATION: MarketingNavigationConfig = {
  headerLinks: [
    { text: "Home", href: "/" },
    { text: "Programs", href: "/storefront" },
    { text: "About", href: "/about" },
    { text: "Blog", href: "/blog" },
    { text: "FAQ", href: "/faq" },
    { text: "Contact", href: "/contact" },
  ],

  footerLinks: [
    { text: "Privacy Policy", href: "/privacy" },
    { text: "Terms of Service", href: "/terms" },
  ],
};
