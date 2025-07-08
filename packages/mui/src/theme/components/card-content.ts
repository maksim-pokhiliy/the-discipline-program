import { Components, Theme } from "@mui/material/styles";

export const MuiCardContent: Components<Theme>["MuiCardContent"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
    }),
  },
};
