export const LAYOUT = {
  logoSize: 54,
  appBarHeight: 64,
  drawerWidth: 260,
} as const;

export type LayoutConfig = typeof LAYOUT;
