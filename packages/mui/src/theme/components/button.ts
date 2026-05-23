import { type Components, type Theme } from "@mui/material/styles";

export const MuiButton: NonNullable<Components<Theme>["MuiButton"]> = {
  defaultProps: {
    disableElevation: true,
  },

  styleOverrides: {
    root: {
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.02857em",
    },

    sizeSmall: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
      padding: theme.spacing(0.5, 1.5),
      minHeight: 32,
    }),

    sizeMedium: ({ theme }) => ({
      fontSize: theme.typography.body1.fontSize,
      padding: theme.spacing(0.75, 2),
      minHeight: 38,
    }),

    sizeLarge: ({ theme }) => ({
      fontSize: theme.typography.h4.fontSize,
      padding: theme.spacing(2, 5),
      minHeight: 56,
    }),
  },
};
