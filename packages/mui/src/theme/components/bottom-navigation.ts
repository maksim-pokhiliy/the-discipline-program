import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiBottomNavigation: Components<Theme>["MuiBottomNavigation"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      height: theme.layout.platformBottomNavHeight,
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
        backgroundColor: theme.palette.action.hover,
      },

      "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
      },
    }),
  },
};
