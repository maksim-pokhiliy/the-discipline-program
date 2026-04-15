import { type Components, type Theme } from "@mui/material/styles";

export const MuiAvatar: Components<Theme>["MuiAvatar"] = {
  defaultProps: {
    variant: "circular",
  },

  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.subtitle1.fontSize,
      fontWeight: 500,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    }),
  },
};
