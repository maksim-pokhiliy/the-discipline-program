import { type Components, type Theme } from "@mui/material/styles";

export const MuiDrawer: Components<Theme>["MuiDrawer"] = {
  defaultProps: {
    anchor: "left",
    elevation: 0,
  },
  styleOverrides: {
    paper: ({ theme }) => ({
      borderRight: `1px solid ${theme.palette.divider}`,
    }),
  },
};
