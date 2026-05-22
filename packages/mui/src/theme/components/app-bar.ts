import { type Components, type Theme } from "@mui/material/styles";

export const MuiAppBar: NonNullable<Components<Theme>["MuiAppBar"]> = {
  defaultProps: {
    elevation: 0,
  },

  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
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
