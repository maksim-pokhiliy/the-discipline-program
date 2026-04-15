import { type Components, type Theme } from "@mui/material/styles";

export const MuiToggleButton: Components<Theme>["MuiToggleButton"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.palette.text.secondary,
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
