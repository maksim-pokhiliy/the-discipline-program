import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiTabs: Components<Theme>["MuiTabs"] = {
  styleOverrides: {
    root: {
      minHeight: 40,
    },

    indicator: {
      height: 2,
      borderRadius: 1,
    },
  },
};

export const MuiTab: Components<Theme>["MuiTab"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      textTransform: "none",
      fontWeight: 500,
      fontSize: theme.typography.pxToRem(14),
      minHeight: 40,
      padding: theme.spacing(0, 1.5),
      color: theme.palette.text.secondary,
      borderRadius: theme.shape.borderRadius,
      transition: theme.transitions.create(["background-color", "color"], {
        duration: theme.transitions.duration.short,
      }),

      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.04),
      },

      "&.Mui-selected": {
        color: theme.palette.text.primary,
      },
    }),
  },
};
