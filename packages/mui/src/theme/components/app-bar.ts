import { type Components, type Theme } from "@mui/material/styles";

export const MuiAppBar: Components<Theme>["MuiAppBar"] = {
  defaultProps: {
    elevation: 0,
  },

  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.appBar.main,
      position: "sticky",
    }),
  },
};
