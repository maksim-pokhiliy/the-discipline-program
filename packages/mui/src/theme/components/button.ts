import { type Components, type Theme } from "@mui/material/styles";

export const MuiButton: Components<Theme>["MuiButton"] = {
  defaultProps: {
    disableElevation: true,
  },

  styleOverrides: {
    root: {},

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
      fontWeight: 500,
      padding: theme.spacing(0.5, 1.5),
      minHeight: 32,
    }),

    sizeMedium: ({ theme }) => ({
      fontSize: theme.typography.body1.fontSize,
      fontWeight: 500,
      padding: theme.spacing(0.75, 2),
      minHeight: 38,
    }),

    sizeLarge: ({ theme }) => ({
      fontSize: theme.typography.h4.fontSize,
      fontWeight: 500,
      padding: theme.spacing(2, 5),
      minHeight: 56,
    }),
  },
};
