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
