import { type Components, type Theme } from "@mui/material/styles";

export const MuiCssBaseline: NonNullable<Components<Theme>["MuiCssBaseline"]> = {
  styleOverrides: {
    html: {
      scrollBehavior: "smooth",
    },
  },
};
