import { type Components, type Theme } from "@mui/material/styles";

export const MuiAppBar: Components<Theme>["MuiAppBar"] = {
  defaultProps: {
    elevation: 0,
  },
};

export const MuiToolbar: Components<Theme>["MuiToolbar"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
      height: "unset",
    }),
  },
};
