import { type Components, type Theme } from "@mui/material/styles";

export const MuiDivider: Components<Theme>["MuiDivider"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderColor: theme.palette.divider,
    }),
  },
};
