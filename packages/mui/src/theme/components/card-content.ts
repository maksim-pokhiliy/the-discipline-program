import { type Components, type Theme } from "@mui/material/styles";

export const MuiCardContent: Components<Theme>["MuiCardContent"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2),
      paddingBottom: `${theme.spacing(2)} !important`,
      height: "100%",
    }),
  },
};
