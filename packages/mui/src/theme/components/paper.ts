import { type Components, type Theme } from "@mui/material/styles";

export const MuiPaper: NonNullable<Components<Theme>["MuiPaper"]> = {
  defaultProps: {
    variant: "outlined",
  },

  styleOverrides: {
    root: {
      backgroundImage: "none",
    },
  },
};
