import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiButton: Components<Theme>["MuiButton"] = {
  defaultProps: {
    disableElevation: true,
    variant: "outlined",
  },

  styleOverrides: {
    root: ({ theme }) => ({
      minWidth: "unset",
      textTransform: "none",
      fontWeight: 500,
      borderRadius: theme.shape.borderRadius,
      transition: theme.transitions.create(
        ["background-color", "border-color", "color", "box-shadow", "transform"],
        { duration: theme.transitions.duration.short },
      ),
    }),

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(13),
      padding: theme.spacing(0.75, 2),
      minHeight: 34,
    }),

    sizeMedium: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(14),
      padding: theme.spacing(1, 2.5),
      minHeight: 40,
    }),

    sizeLarge: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(16),
      fontWeight: 600,
      padding: theme.spacing(1.75, 5),
      minHeight: 52,
      letterSpacing: "0.01em",
    }),

    contained: {
      fontWeight: 600,
    },

    outlined: () => ({
      borderWidth: 1,
      "&:hover": {
        borderWidth: 1,
      },
      "&.Mui-disabled": {
        borderWidth: 1,
      },
    }),

    textPrimary: ({ theme }) => ({
      color: theme.palette.primary.main,
      "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.06),
      },
    }),

    textSecondary: ({ theme }) => ({
      color: theme.palette.text.secondary,
      "&:hover": {
        color: theme.palette.text.primary,
        backgroundColor: alpha(theme.palette.common.white, 0.04),
      },
    }),

    textInherit: ({ theme }) => ({
      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.04),
      },
    }),

    outlinedPrimary: ({ theme }) => ({
      "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.06),
      },
    }),

    outlinedSecondary: ({ theme }) => ({
      "&:hover": {
        backgroundColor: alpha(theme.palette.secondary.main, 0.06),
      },
    }),

    outlinedInherit: ({ theme }) => ({
      borderColor: theme.palette.divider,
      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.04),
        borderColor: alpha(theme.palette.common.white, 0.2),
      },
    }),

    containedInherit: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.common.white, 0.08),
      color: theme.palette.text.primary,
      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.12),
      },
    }),
  },
};
