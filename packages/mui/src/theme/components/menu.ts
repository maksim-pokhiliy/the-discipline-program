import { type Components, type Theme } from "@mui/material/styles";

export const MuiMenu: Components<Theme>["MuiMenu"] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      marginTop: theme.spacing(1),
    }),

    list: ({ theme }) => ({
      padding: theme.spacing(0.5),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(0.5),
    }),
  },
};

export const MuiMenuItem: Components<Theme>["MuiMenuItem"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(1),
      minHeight: "unset",
      borderRadius: theme.shape.borderRadius,
    }),
  },
};
