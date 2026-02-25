export const LAYOUT = {
  logoSize: 64,
  platformLogoSize: 52,
  appBarHeight: 100,
  adminHeaderHeight: 64,
  drawerWidth: 280,
  drawerCollapsedWidth: 72,
  platformHeaderHeight: 56,
  platformBottomNavHeight: 56,
} as const;

export type LayoutConfig = typeof LAYOUT;
