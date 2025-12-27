export interface NavLink {
  text: string;
  href: string;
  icon?: string;
}

export interface AdminNavigationConfig {
  links: NavLink[];
}

export interface MarketingNavigationConfig {
  headerLinks: NavLink[];
  footerLinks: NavLink[];
}

export const ADMIN_NAVIGATION: AdminNavigationConfig = {
  links: [
    { text: "Dashboard", href: "/" },
    { text: "Programs", href: "/programs" },
    { text: "Reviews", href: "/reviews" },
    { text: "Blog", href: "/blog" },
    { text: "Pages", href: "/pages" },
    { text: "Orders", href: "/orders" },
    { text: "Contacts", href: "/contacts" },
  ],
};

export const MARKETING_NAVIGATION: MarketingNavigationConfig = {
  headerLinks: [
    { text: "Home", href: "/" },
    { text: "Programs", href: "/programs" },
    { text: "Reviews", href: "/#reviews" },
    { text: "About", href: "/about" },
    { text: "Blog", href: "/blog" },
    { text: "Contact", href: "/contact" },
  ],

  footerLinks: [
    { text: "Privacy Policy", href: "/privacy" },
    { text: "Terms of Service", href: "/terms" },
  ],
};
