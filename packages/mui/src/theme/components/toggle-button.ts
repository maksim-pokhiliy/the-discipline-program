import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiToggleButton: Components<Theme>["MuiToggleButton"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      textTransform: "none",
      fontWeight: 500,
      borderColor: theme.palette.divider,
      color: theme.palette.text.secondary,
      transition: theme.transitions.create(["background-color", "color", "border-color"], {
        duration: theme.transitions.duration.short,
      }),

      "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
        color: theme.palette.primary.main,
        borderColor: alpha(theme.palette.primary.main, 0.3),

        "&:hover": {
          backgroundColor: alpha(theme.palette.primary.main, 0.18),
        },
      },

      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.04),
      },
    }),

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(13),
      padding: theme.spacing(0.5, 1.25),
      minHeight: 30,
    }),

    sizeMedium: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      padding: theme.spacing(0.75, 1.75),
      minHeight: 36,
    }),

    sizeLarge: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(15),
      padding: theme.spacing(1, 2.25),
      minHeight: 42,
    }),
  },
};

export const MuiToggleButtonGroup: Components<Theme>["MuiToggleButtonGroup"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
    }),

    grouped: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      "&:not(:first-of-type)": {
        marginLeft: -1,
        borderLeft: `1px solid ${theme.palette.divider}`,
      },
    }),
  },
};
