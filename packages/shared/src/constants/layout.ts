export const LAYOUT = {
  logoSize: 64,
  appBarHeight: 100,
  adminHeaderHeight: 64,
  drawerWidth: 280,
  drawerCollapsedWidth: 72,
} as const;

export type LayoutConfig = typeof LAYOUT;
