import { type Components, type Theme } from "@mui/material/styles";

export const MuiDialog: Components<Theme>["MuiDialog"] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      border: `1px solid ${theme.palette.divider}`,
    }),
  },
};

export const MuiDialogTitle: Components<Theme>["MuiDialogTitle"] = {
  styleOverrides: {
    root: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
  },
};

export const MuiDialogContent: Components<Theme>["MuiDialogContent"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      "&:first-of-type": {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
      },
    }),
  },
};
