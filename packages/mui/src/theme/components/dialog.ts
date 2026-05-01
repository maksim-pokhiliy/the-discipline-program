import { type Components, type Theme } from "@mui/material/styles";

export const MuiDialogTitle: NonNullable<Components<Theme>["MuiDialogTitle"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: theme.typography.h4.fontSize,
    }),
  },
};

export const MuiDialogContent: NonNullable<Components<Theme>["MuiDialogContent"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),

      ".MuiDialogTitle-root + &": {
        paddingTop: theme.spacing(3),
      },
    }),
  },
};

export const MuiDialogActions: NonNullable<Components<Theme>["MuiDialogActions"]> = {
  defaultProps: {
    disableSpacing: false,
  },

  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
    }),
  },
};
