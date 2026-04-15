import { type Components, type Theme } from "@mui/material/styles";

export const MuiTypography: Components<Theme>["MuiTypography"] = {
  defaultProps: {
    variantMapping: {
      display1: "h1",
      display2: "h2",
    },
  },
};
