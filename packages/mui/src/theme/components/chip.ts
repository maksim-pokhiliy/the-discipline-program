import { type Components, type Theme } from "@mui/material/styles";

export const MuiChip: Components<Theme>["MuiChip"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      minWidth: 26,
      fontWeight: 500,
      borderRadius: theme.shape.borderRadius,
      padding: theme.spacing(0.1),
    }),
  },
};
