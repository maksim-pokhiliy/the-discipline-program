import { type Components, type Theme } from "@mui/material/styles";

export const MuiAppBar: NonNullable<Components<Theme>["MuiAppBar"]> = {
  defaultProps: {
    elevation: 0,
  },

  styleOverrides: {
    root: {
      border: "none",
    },
  },
};

export const MuiToolbar: NonNullable<Components<Theme>["MuiToolbar"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
      height: "unset",
    }),
  },
};
