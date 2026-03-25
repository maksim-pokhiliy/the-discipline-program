import { type Components, type Theme } from "@mui/material/styles";

export const MuiCard: Components<Theme>["MuiCard"] = {
  defaultProps: {
    variant: "outlined",
    elevation: 0,
  },

  styleOverrides: {
    root: ({ ownerState, theme }) => ({
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: "none",

      ...(ownerState.variant === "elevation" && {
        backgroundColor: theme.palette.background.default,
      }),

      ...(ownerState.variant === "outlined" && {
        backgroundColor: theme.palette.background.paper,
      }),
    }),
  },
};
