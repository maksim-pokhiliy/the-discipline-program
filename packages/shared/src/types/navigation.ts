export interface NavLink {
  text: string;
  href: string;
  icon?: string;
}

export interface AdminNavLink {
  text: string;
  href: string;
  icon: string;
}

export interface AdminNavGroup {
  label: string;
  links: AdminNavLink[];
}

export interface AdminNavigationConfig {
  dashboard: AdminNavLink;
  groups: AdminNavGroup[];
}

export interface MarketingNavigationConfig {
  headerLinks: NavLink[];
  footerLinks: NavLink[];
}

export interface PlatformNavItem {
  label: string;
  href: string;
  icon: string;
}

export interface PlatformNavigationConfig {
  items: PlatformNavItem[];
}
