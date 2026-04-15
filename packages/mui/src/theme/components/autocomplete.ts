import { type Components, type Theme } from "@mui/material/styles";

export const MuiAutocomplete: Components<Theme>["MuiAutocomplete"] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      marginTop: theme.spacing(1),
    }),

    listbox: ({ theme }) => ({
      padding: theme.spacing(0.5),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(0.5),
    }),

    option: ({ theme }) => ({
      padding: theme.spacing(1),
      minHeight: "unset",
      flexShrink: 0,
      borderRadius: theme.shape.borderRadius,
    }),
  },
};
