export type NavLink = {
  text: string;
  href: string;
  icon?: string;
};

export type AdminNavLink = {
  text: string;
  href: string;
  icon: string;
};

export type AdminNavGroup = {
  label: string;
  links: AdminNavLink[];
};

export type AdminNavigationConfig = {
  dashboard: AdminNavLink;
  groups: AdminNavGroup[];
};

export type MarketingNavigationConfig = {
  headerLinks: NavLink[];
  footerLinks: NavLink[];
};

export type PlatformNavItem = {
  label: string;
  href: string;
  icon: string;
};

export type PlatformNavigationConfig = {
  items: PlatformNavItem[];
};
