import { type Components, type Theme } from "@mui/material/styles";

export const MuiPaper: Components<Theme>["MuiPaper"] = {
  defaultProps: {
    elevation: 0,
  },

  styleOverrides: {
    outlined: ({ theme }) => ({
      borderColor: theme.palette.divider,
    }),
  },
};
