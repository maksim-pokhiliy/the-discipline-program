import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiTabs: Components<Theme>["MuiTabs"] = {
  styleOverrides: {
    indicator: {
      display: "none",
    },

    flexContainer: ({ theme }) => ({
      gap: theme.spacing(1.5),
    }),
  },
};

export const MuiTab: Components<Theme>["MuiTab"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(0, 3),
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
