import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiTabs: NonNullable<Components<Theme>["MuiTabs"]> = {
  styleOverrides: {
    indicator: {
      display: "none",
    },

    flexContainer: ({ theme }) => ({
      gap: theme.spacing(1.5),
    }),
  },
};

export const MuiTab: NonNullable<Components<Theme>["MuiTab"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(0, 3),
      borderRadius: theme.shape.borderRadius,

      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },

      "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),

        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
        },
      },

      "&.Mui-focusVisible": {
        backgroundColor: "transparent",
      },
    }),
  },
};
