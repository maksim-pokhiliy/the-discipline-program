import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiCard: Components<Theme>["MuiCard"] = {
  defaultProps: {
    variant: "outlined",
  },

  styleOverrides: {
    root: ({ theme }) => ({
      height: "100%",
      borderRadius: theme.shape.borderRadius,
      borderColor: alpha(theme.palette.common.white, 0.1),
    }),
  },
};
