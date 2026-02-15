import { type Components, type Theme } from "@mui/material/styles";

export const MuiDrawer: Components<Theme>["MuiDrawer"] = {
  defaultProps: {
    anchor: "left",
    elevation: 0,
  },

  styleOverrides: {
    paper: ({ theme }) => ({
      backgroundColor: theme.palette.drawer.main,
    }),
  },
};
