import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiBottomNavigation: Components<Theme>["MuiBottomNavigation"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: theme.layout.platformBottomNavHeight,
      zIndex: theme.zIndex.appBar,
      borderTop: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(1.5),
      gap: theme.spacing(1.5),
    }),
  },
};

export const MuiBottomNavigationAction: Components<Theme>["MuiBottomNavigationAction"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,

      "&:hover": {
        backgroundColor: alpha(theme.palette.action.hover, theme.palette.action.hoverOpacity),
      },

      "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
      },
    }),
  },
};
