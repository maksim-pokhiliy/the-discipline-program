import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiChip: Components<Theme>["MuiChip"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: 500,
      borderRadius: theme.shape.borderRadius,
    }),

    sizeSmall: ({ theme }) => ({
      height: 22,
      fontSize: theme.typography.pxToRem(11),
      padding: theme.spacing(0, 0.75),
    }),

    sizeMedium: ({ theme }) => ({
      height: 28,
      fontSize: theme.typography.pxToRem(13),
      padding: theme.spacing(0, 1.25),
    }),

    filled: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.common.white, 0.08),
      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.12),
      },
    }),

    outlined: ({ theme }) => ({
      borderColor: theme.palette.divider,
    }),

    deleteIcon: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(16),
      color: theme.palette.text.secondary,
      "&:hover": {
        color: theme.palette.text.primary,
      },
    }),

    label: {
      padding: 0,
    },

    labelSmall: {
      padding: 0,
    },
  },
};
