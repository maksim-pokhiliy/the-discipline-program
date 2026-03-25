import { type Components, type Theme } from "@mui/material/styles";

export const MuiAppBar: Components<Theme>["MuiAppBar"] = {
  defaultProps: {
    elevation: 0,
  },

  styleOverrides: {
    root: ({ theme }) => ({
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
  },
};
