export const LAYOUT = {
  logoSize: 64,
  platformLogoSize: 52,
  adminHeaderHeight: 64,
  drawerWidth: 280,
  drawerCollapsedWidth: 72,
  platformHeaderHeight: 56,
  platformBottomNavHeight: 80,
  platformFabBottom: 100,
} as const;

export type LayoutConfig = typeof LAYOUT;
