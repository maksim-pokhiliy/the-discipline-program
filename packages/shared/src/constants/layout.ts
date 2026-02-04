export const LAYOUT = {
  logoSize: 64,
  appBarHeight: 100,
  drawerWidth: 260,
} as const;

export type LayoutConfig = typeof LAYOUT;
