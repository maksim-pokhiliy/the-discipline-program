import { type Components, type Theme } from "@mui/material/styles";

export const MuiAutocomplete: Components<Theme>["MuiAutocomplete"] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      marginTop: theme.spacing(1),
      border: `1px solid ${theme.palette.divider}`,
    }),

    listbox: ({ theme }) => ({
      padding: theme.spacing(0.5),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(0.5),
    }),

    option: ({ theme }) => ({
      display: "flex",
      padding: theme.spacing(1),
      minHeight: 38,
      borderRadius: Number(theme.shape.borderRadius),
    }),
  },
};
