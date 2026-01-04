import { type Components, type Theme } from "@mui/material/styles";

export const MuiCard: Components<Theme>["MuiCard"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
      border: `2px solid ${theme.palette.divider}`,
      height: "100%",
    }),
  },
};
