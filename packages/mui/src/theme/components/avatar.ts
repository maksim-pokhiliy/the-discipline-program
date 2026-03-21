import { type Components, type Theme } from "@mui/material/styles";

export const MuiAvatar: Components<Theme>["MuiAvatar"] = {
  defaultProps: {
    variant: "circular",
  },

  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: 500,
      fontSize: theme.typography.subtitle1.fontSize,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      width: 32,
      height: 32,
    }),
  },
};
