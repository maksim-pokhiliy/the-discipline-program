import { Components, Theme } from "@mui/material/styles";

export const MuiDrawer: Components<Theme>["MuiDrawer"] = {
  defaultProps: {
    anchor: "left",
    elevation: 0,
  },

  styleOverrides: {
    paper: ({ theme }) => ({
      width: "100vw",
      maxWidth: 300,
      backgroundColor: theme.palette.drawer.main,
    }),
  },
};
